import { createLogger } from '../../../utils/logger';

const log = createLogger('Spinner');

/**
 * [M-24][L-11] 入参防御逻辑抽到单一模块,native/web 两端 import 同一份:
 *   - 去重 warn:同一异常值只告警一次(模块级 Set 记录),避免渲染路径每帧刷日志。
 *   - size / thickness 两字段均覆盖非有限值告警(thickness 原缺失 isFinite 守卫)。
 *   - 返回已钳制的安全值,调用方直接使用。
 */

const warnedKeys = new Set<string>();

function warnOnce(key: string, msg: string) {
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  log.warn(msg);
}

export function sanitizeSpinnerProps(
  size: number,
  thickness: number
): { safeSize: number; safeThickness: number } {
  if (!Number.isFinite(size) || size < 8) {
    warnOnce(`size:${size}`, `size 应为 ≥8 的有限数，传入 ${size}，已钳到 8`);
  }
  if (!Number.isFinite(thickness) || thickness <= 0) {
    warnOnce(
      `thickness:${thickness}`,
      `thickness 应为正有限数，传入 ${thickness}，已 fallback 为 2`
    );
  }
  return {
    safeSize: Number.isFinite(size) && size > 8 ? size : 8,
    safeThickness: Number.isFinite(thickness) && thickness > 0 ? thickness : 2,
  };
}
