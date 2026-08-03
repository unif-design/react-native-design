import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

export type WebTransitionStyle = ViewStyle & {
  transitionProperty?: 'opacity';
  transitionDuration?: string;
  transitionTimingFunction?: 'ease-out';
};

type RevealWebStyleResolution = {
  callerStyle: StyleProp<ViewStyle> | undefined;
  targetOpacity: number;
};

type RevealWebAnimatedStyleOptions = {
  targetOpacity: number;
  visible: boolean;
  animate: boolean;
  duration: number;
};

export type RevealAnimationFrameApi = {
  requestAnimationFrame: (callback: () => void) => number;
  cancelAnimationFrame: (id: number) => void;
};

type RevealAnimationFrameOptions = {
  api: RevealAnimationFrameApi | undefined;
  isCurrent: () => boolean;
  onVisible: () => void;
};

function isEmptyStyleInput(value: unknown): boolean {
  if (value === undefined || value === null || value === false) return true;
  if (!Array.isArray(value)) return false;
  return value.every(isEmptyStyleInput);
}

/**
 * Web Reveal 只读取 caller 最终 opacity，不修改合法 caller style。
 * flatten 或 runtime 输入异常时丢弃 hostile style，避免把同一异常继续传给 View。
 */
export function resolveRevealWebStyle(
  style: unknown
): RevealWebStyleResolution {
  try {
    if (isEmptyStyleInput(style)) {
      return { callerStyle: undefined, targetOpacity: 1 };
    }

    const flattened = StyleSheet.flatten(
      style as StyleProp<ViewStyle>
    ) as unknown;
    if (
      flattened === undefined ||
      flattened === null ||
      typeof flattened !== 'object' ||
      Array.isArray(flattened)
    ) {
      return { callerStyle: undefined, targetOpacity: 1 };
    }

    const opacity = (flattened as ViewStyle).opacity;
    return {
      callerStyle: style as StyleProp<ViewStyle>,
      targetOpacity:
        typeof opacity === 'number' &&
        Number.isFinite(opacity) &&
        opacity >= 0 &&
        opacity <= 1
          ? opacity
          : 1,
    };
  } catch {
    return { callerStyle: undefined, targetOpacity: 1 };
  }
}

export function createRevealWebAnimatedStyle({
  targetOpacity,
  visible,
  animate,
  duration,
}: RevealWebAnimatedStyleOptions): WebTransitionStyle {
  return {
    opacity: visible ? targetOpacity : 0,
    ...(animate
      ? {
          transitionProperty: 'opacity' as const,
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: 'ease-out' as const,
        }
      : {}),
  };
}

/**
 * 两个 RAF id 独立保存；cleanup 即使发生在任意一帧之间，也会取消已知 id。
 * cancelled + generation 双重保护保证旧回调不能写入新一轮 Reveal。
 */
export function scheduleRevealAnimationFrames({
  api,
  isCurrent,
  onVisible,
}: RevealAnimationFrameOptions): () => void {
  let firstFrameId: number | undefined;
  let secondFrameId: number | undefined;
  let cancelled = false;

  const isActive = () => {
    if (cancelled) return false;
    try {
      return isCurrent();
    } catch {
      return false;
    }
  };
  const show = () => {
    if (isActive()) onVisible();
  };

  if (api === undefined) {
    show();
    return () => {
      cancelled = true;
    };
  }

  try {
    firstFrameId = api.requestAnimationFrame(() => {
      if (!isActive()) return;
      try {
        secondFrameId = api.requestAnimationFrame(show);
      } catch {
        show();
      }
    });
  } catch {
    show();
  }

  return () => {
    cancelled = true;
    if (firstFrameId !== undefined) {
      try {
        api.cancelAnimationFrame(firstFrameId);
      } catch {
        // cancel 失败时仍由 cancelled / generation guard 阻止旧回调写状态。
      }
    }
    if (secondFrameId !== undefined) {
      try {
        api.cancelAnimationFrame(secondFrameId);
      } catch {
        // 同上。
      }
    }
  };
}
