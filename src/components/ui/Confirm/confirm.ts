/**
 * 命令式 `confirm()` API —— 跟 `<ConfirmHost />` 配对使用。
 *
 * 业务任意位置 `const ok = await confirm({title, message, ...})`,
 * 不用维护 useState / open / onClose。
 *
 * 状态机全部在 `store.ts`(纯逻辑、可单测);本文件只持有唯一的模块级实例,
 * 并把内部入口暴露给 `ConfirmHost.tsx`。这两个内部导出**不进公共 barrel**。
 */
import { createLogger } from '../../../utils/logger';
import { createConfirmStore } from './store';
import type { ConfirmOptions } from './types';

const log = createLogger('confirm');

const store = createConfirmStore(log);

/**
 * 弹出确认对话框,返回 Promise<boolean>。
 * - 用户点确认 → resolve(true)
 * - 用户点取消 / 点 backdrop / 系统返回 → resolve(false)
 * - 未挂 `<ConfirmHost />`、已有对话框在显示、Host 渲染抛错、Host 卸载 → resolve(false)
 *
 * 任何路径都必然 settle,不会悬挂。
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
export const confirm = (options: ConfirmOptions): Promise<boolean> =>
  store.request(options);

/** 内部:ConfirmHost 挂载时注册唯一 owner;重复挂载得到 null。 */
export const registerConfirmHost = store.registerHost;

/** 内部:所有关闭路径的唯一出口(identity-guarded + 幂等)。 */
export const settleConfirm = store.settle;
