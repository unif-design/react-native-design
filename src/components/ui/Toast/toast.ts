/**
 * 命令式 `toast()` API —— 与 `<ToastHost />` 配对使用。
 *
 * 文件名故意小写 `toast.ts`,host 组件叫 `ToastHost.tsx`,避免 APFS 大小写冲突。
 */
import { createLogger } from '../../../utils/logger';
import type { Subscriber, ToastEntry, ToastInput, ToastKind } from './types';

const log = createLogger('toast');

let _id = 0;
export const _subs = new Set<Subscriber>();

const DEFAULT_DURATION = 3000;
// [L-55] duration 合法域:[1, 2^31)。INT32_MAX = 2^31-1 = 2147483647,
// setTimeout 内部用 int32 存储,超出会溢出变成 0 立即触发。
const MAX_DURATION = 2147483647;

/** [L-55] 钳制 duration 到 [1, 2^31),域外回落 DEFAULT_DURATION 并 dev warn。 */
function clampDuration(raw: number | undefined): number {
  if (raw == null) return DEFAULT_DURATION;
  if (!Number.isFinite(raw) || raw < 1 || raw >= MAX_DURATION) {
    log.warn(
      `toast duration(${raw}) 超出合法域 [1, 2^31),已回落 ${DEFAULT_DURATION}ms。`
    );
    return DEFAULT_DURATION;
  }
  return Math.trunc(raw);
}

function emit(input: ToastInput, kind: ToastKind = 'info') {
  const entry: ToastEntry =
    typeof input === 'string'
      ? {
          id: ++_id,
          message: input,
          kind,
          duration: DEFAULT_DURATION,
          position: 'bottom',
        }
      : {
          id: ++_id,
          message: input.message,
          kind: input.kind ?? kind,
          duration: clampDuration(input.duration),
          position: input.position ?? 'bottom',
        };
  // 未挂 <ToastHost />:消息无人接收,告警提示集成漏挂(对照 confirm 重入告警的纪律)。
  if (_subs.size === 0) {
    log.warn(
      'toast() 调用时未挂载 <ToastHost />,消息被丢弃。请在 app 根附近挂一次 <ToastHost />。'
    );
    return;
  }
  _subs.forEach((s) => s(entry));
}

/**
 * 命令式 toast API。在 app 根附近挂一次 `<ToastHost />` 即可。
 *
 * toast('已切换到日报');
 * toast.success('订单提交成功');
 * toast.error('网络异常，请重试');
 * toast({ message: '正在同步…', duration: 5000 });
 */
export const toast = Object.assign((input: ToastInput) => emit(input, 'info'), {
  info: (input: ToastInput) => emit(input, 'info'),
  success: (input: ToastInput) => emit(input, 'success'),
  error: (input: ToastInput) => emit(input, 'error'),
});
