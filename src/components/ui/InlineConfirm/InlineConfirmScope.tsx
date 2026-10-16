import { useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import { InlineConfirmContext } from './context';
import type {
  InlineConfirmCoordinator,
  InlineConfirmOwner,
  InlineConfirmScopeProps,
} from './types';

interface ConfirmationClaim {
  owner: InlineConfirmOwner;
}

export function InlineConfirmScope({
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onStartShouldSetResponderCapture,
  onAccessibilityEscape,
  ...props
}: InlineConfirmScopeProps) {
  const current = useRef<ConfirmationClaim | undefined>(undefined);
  const pending = useRef<ConfirmationClaim | undefined>(undefined);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const scope = useMemo<InlineConfirmCoordinator>(
    () => ({
      claim(owner) {
        const previous = current.current;
        current.current = { owner };
        if (previous?.owner !== owner) previous?.owner.cancel();
      },
      release(owner) {
        if (current.current?.owner === owner) current.current = undefined;
      },
      cancel() {
        const previous = current.current;
        current.current = undefined;
        previous?.owner.cancel();
      },
    }),
    []
  );
  useEffect(
    () => () => {
      if (releaseTimer.current !== undefined)
        clearTimeout(releaseTimer.current);
      pending.current = undefined;
    },
    []
  );
  const beginOutsidePress = () => {
    pending.current = current.current;
  };
  const finishOutsidePress = () => {
    const claim = pending.current;
    pending.current = undefined;
    if (!claim) return;
    if (releaseTimer.current !== undefined) clearTimeout(releaseTimer.current);
    // 释放事件交付完后才收回宽度，避免相邻按钮在按下与抬起之间移走。
    releaseTimer.current = setTimeout(() => {
      releaseTimer.current = undefined;
      if (current.current === claim) scope.cancel();
    }, 0);
  };
  // RNW View 转发这些事件；RNGH 的 pointerup 停止冒泡，不影响 mouseup。
  const webReleaseProps =
    Platform.OS === 'web'
      ? {
          onMouseUp: finishOutsidePress,
          onTouchEndCapture: finishOutsidePress,
          onTouchCancelCapture: finishOutsidePress,
        }
      : {};
  return (
    <InlineConfirmContext.Provider value={scope}>
      <View
        {...props}
        {...webReleaseProps}
        onStartShouldSetResponderCapture={(event) => {
          // RNGH Web 按钮停止 pointerdown 冒泡，RNW View 不转发 pointer capture。
          // responder 捕获期能观察鼠标和触摸，但此处始终不抢占 responder。
          if (
            Platform.OS === 'web' &&
            !current.current?.owner.containsTarget(event.target)
          )
            beginOutsidePress();
          return onStartShouldSetResponderCapture?.(event) ?? false;
        }}
        onTouchStart={(event) => {
          beginOutsidePress();
          onTouchStart?.(event);
        }}
        onTouchEnd={(event) => {
          finishOutsidePress();
          onTouchEnd?.(event);
        }}
        onTouchCancel={(event) => {
          finishOutsidePress();
          onTouchCancel?.(event);
        }}
        onPointerDown={(event) => {
          beginOutsidePress();
          onPointerDown?.(event);
        }}
        onPointerUp={(event) => {
          finishOutsidePress();
          onPointerUp?.(event);
        }}
        onPointerCancel={(event) => {
          finishOutsidePress();
          onPointerCancel?.(event);
        }}
        onAccessibilityEscape={() => {
          scope.cancel();
          onAccessibilityEscape?.();
        }}
      />
    </InlineConfirmContext.Provider>
  );
}
