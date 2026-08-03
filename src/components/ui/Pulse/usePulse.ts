import { useEffect, useMemo } from 'react';
import { createLogger } from '../../../utils/logger';
import { normalizePulseOptions } from './normalizePulseOptions';
import type { PulseDefaults } from './normalizePulseOptions';
import { usePulseDriver } from './usePulseDriver';
import type { PulseOptions } from './types';

/**
 * 在两个 opacity 值之间无限循环,返回可直接拼到 Animated.View 上的 style。
 *
 * 这是**唯一**的公共实现:参数校验、默认值与 dev 诊断全在这里完成,平台差异只下沉到
 * `usePulseDriver(.web).ts`。此前 native / web 各有一份 `usePulse`,两边各自读原始
 * props、各自解释默认值,web 侧还把未校验的 duration 直接喂给 `setInterval`。
 */

const BASE_DEFAULTS: PulseDefaults = {
  duration: 700,
  delay: 0,
  from: 0.6,
  to: 1,
};

/** PulseDot / Skeleton 的默认值 —— 只有 from 更低,圆点 / 骨架淡到 0.5。 */
export const DOT_DEFAULTS: PulseDefaults = {
  duration: 700,
  delay: 0,
  from: 0.5,
  to: 1,
};

// logger 在模块加载时一次性建好 —— render 期创建每次都会产生新对象。
const pulseLog = createLogger('Pulse');
const pulseDotLog = createLogger('PulseDot');
const skeletonLog = createLogger('Skeleton');

/** 诊断告警的固定 scope 集合。 */
export type PulseScope = 'Pulse' | 'PulseDot' | 'Skeleton';

function loggerForScope(scope: PulseScope) {
  switch (scope) {
    case 'Pulse':
      return pulseLog;
    case 'PulseDot':
      return pulseDotLog;
    case 'Skeleton':
      return skeletonLog;
  }
}

/** 内部:让 PulseDot / Skeleton 复用同一条归一化 + 诊断 + driver 链路。 */
export function usePulseWithDefaults(
  options: PulseOptions | undefined,
  defaults: PulseDefaults,
  scope: PulseScope
) {
  // 依赖列表**故意**拆到 primitive:options / defaults 对象每次 render 都可能是新引用
  // (调用方常写内联字面量),直接依赖对象会让 memo 恒失效、并连带每帧重启 driver 的 effect。
  // 这八个 primitive 就是归一化的全部输入,拆开后覆盖完整、无遗漏。
  const normalized = useMemo(
    () => normalizePulseOptions(options, defaults),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      options?.duration,
      options?.delay,
      options?.from,
      options?.to,
      defaults.duration,
      defaults.delay,
      defaults.from,
      defaults.to,
    ]
  );
  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      for (const item of normalized.diagnostics) {
        loggerForScope(scope).warn(
          `${item.field}=${String(item.received)} 无效,已回退为 ${item.fallback}`
        );
      }
    }
  }, [normalized.diagnostics, scope]);
  return usePulseDriver(normalized);
}

export function usePulse(options: PulseOptions = {}) {
  return usePulseWithDefaults(options, BASE_DEFAULTS, 'Pulse');
}
