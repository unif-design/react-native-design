/** Confirm 入参。 */
export type ConfirmOptions = {
  /** 主标题 —— 短且明确,如 "确认注销账号?" */
  title: string;
  /** 说明文本 —— 1-2 句解释操作后果。可选 */
  message?: string;
  /** 确认按钮文案,默认 "确认" */
  confirmLabel?: string;
  /** 取消按钮文案,默认 "取消" */
  cancelLabel?: string;
  /** 标记为破坏性操作 —— 确认按钮变红(c.error),用于"删除 / 注销 / 取消订单" */
  destructive?: boolean;
};

// entry / event / lease 类型都在 `store.ts` —— 它们是 Host 与 Store 之间的内部协议,
// 不进公共 barrel。本文件只保留对外的 `ConfirmOptions`。
