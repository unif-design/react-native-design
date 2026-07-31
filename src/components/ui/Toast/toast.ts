/**
 * 命令式 `toast()` API —— 与 `<ToastHost />` 配对使用。
 *
 * 文件名故意小写 `toast.ts`,host 组件叫 `ToastHost.tsx`,避免 APFS 大小写冲突。
 *
 * 本文件只做公共入参归一化(kind / duration / position),投递与身份仲裁全部在
 * `store.ts`。下面三个内部导出只给两个 Host 用,**不进公共 barrel**。
 */
import { createLogger } from '../../../utils/logger';
import { createToastStore } from './store';
import type { ToastEntry, ToastInput, ToastKind } from './types';

const log = createLogger('toast');

const store = createToastStore(log);

let _id = 0;

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
  // 未挂 <ToastHost /> 是**受支持路径**:消息留在 pending,Host 挂上后立即补投。
  // 故这里不告警 —— 启动早期的 toast 本来就可能先于 Host。
  store.publish(entry);
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

/** 内部:ToastHost 挂载时注册唯一 owner;重复挂载得到 null。 */
export const registerToastHost = store.registerHost;

/** 内部:三重身份 CAS —— owner token + leaseId + entry id 全对才算完成。 */
export const completeToast = store.complete;

/** 内部:timer / RAF / 动画回调动 UI 前的守卫。 */
export const isCurrentToastDelivery = store.isCurrent;
