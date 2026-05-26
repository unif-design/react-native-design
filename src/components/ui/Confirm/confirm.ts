/**
 * 命令式 `confirm()` API —— 跟 `<ConfirmHost />` 配对使用。
 *
 * 业务任意位置 `const ok = await confirm({title, message, ...})`,
 * 不用维护 useState / open / onClose。
 *
 * 同一时间只允许 1 个 confirm 活跃;若已有正在显示,新请求立即 resolve(false) 并 warn。
 */
import { createLogger } from '@/utils/logger';
import type { ConfirmOptions, ConfirmEntry, Subscriber } from './types';

const log = createLogger('confirm');

let _id = 0;
let _activeEntry: ConfirmEntry | null = null;
export const _subs = new Set<Subscriber>();

/**
 * 弹出确认对话框,返回 Promise<boolean>。
 * - 用户点确认 → resolve(true)
 * - 用户点取消 / 点 backdrop / 拖关闭 → resolve(false)
 *
 * 示例:
 * ```ts
 * const ok = await confirm({
 *   title: '确认注销账号?',
 *   message: '注销后所有数据删除,无法恢复',
 *   confirmLabel: '确认注销',
 *   destructive: true,
 * });
 * if (ok) doLogout();
 * ```
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (_activeEntry) {
    log.warn(
      'confirm() 已有一个对话框在显示,新请求被拒绝(同一时间只 1 个,避免叠加)。'
    );
    return Promise.resolve(false);
  }
  return new Promise<boolean>((resolve) => {
    const entry: ConfirmEntry = {
      id: ++_id,
      ...options,
      resolve: (confirmed: boolean) => {
        _activeEntry = null;
        resolve(confirmed);
      },
    };
    _activeEntry = entry;
    _subs.forEach((s) => s(entry));
  });
}
