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

function emit(input: ToastInput, kind: ToastKind = 'info') {
  const entry: ToastEntry =
    typeof input === 'string'
      ? { id: ++_id, message: input, kind, duration: 3000, position: 'bottom' }
      : {
          id: ++_id,
          message: input.message,
          kind: input.kind ?? kind,
          duration: input.duration ?? 3000,
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
