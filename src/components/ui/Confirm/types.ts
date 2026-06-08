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

/** Host 内部 entry —— options + resolve 回调,用户点 确认/取消/backdrop 时 resolve。 */
export type ConfirmEntry = ConfirmOptions & {
  id: number;
  resolve: (confirmed: boolean) => void;
};

/** ConfirmHost 监听器签名 —— 收到 entry 渲染对话框;收到 null 表示关闭。 */
export type Subscriber = (entry: ConfirmEntry | null) => void;
