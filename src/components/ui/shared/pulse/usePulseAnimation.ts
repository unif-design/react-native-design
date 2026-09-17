import { useEffect, useMemo } from 'react';
import type { createLogger } from '../../../../utils/logger';
import type { PulseOptions } from '../../Pulse/types';
import type { PulseDefaults } from './types';
import { normalizePulseOptions } from './normalizePulseOptions';
import { usePulseDriver } from './usePulseDriver';

/** 共享参数解释与平台驱动；默认值和诊断 scope 由所属组件交付。 */
export function usePulseAnimation(
  { duration, delay, from, to }: PulseOptions = {},
  defaults: Readonly<PulseDefaults>,
  log: ReturnType<typeof createLogger>
) {
  // 各组件交付自己的固定默认值；内联 options 的新引用不重启动效。
  const normalized = useMemo(
    () => normalizePulseOptions({ duration, delay, from, to }, defaults),
    [duration, delay, from, to, defaults]
  );
  useEffect(() => {
    if (__DEV__) {
      for (const item of normalized.diagnostics) {
        log.warn(
          `${item.field}=${String(item.received)} 无效,已回退为 ${item.fallback}`
        );
      }
    }
  }, [normalized.diagnostics, log]);
  return usePulseDriver(normalized);
}
