/** Stepper 尺寸：xs=24px / sm=28px / md=32px */
export type StepperSize = 'xs' | 'sm' | 'md';

export interface StepperProps {
  /** 当前值（受控） */
  value: number;
  /** 值提交回调（已自动夹到 [min, max] 区间）；明确输入相同值也会交付一次 */
  onChange: (value: number) => void;
  /** 中央 adjustable 的上下文名称，左右按钮自动组合“${label}，减少 / 增加” */
  accessibilityLabel: string;
  /** 最小值，默认 0 */
  min?: number;
  /** 最大值，默认 99 */
  max?: number;
  /** 增减步长，默认 1；非正数会回退为 1 */
  step?: number;
  /** 尺寸，默认 'md' */
  size?: StepperSize;
  /** 自定义中央值的可见文案；数值运算与 adjustable 语义仍使用归一化后的 number */
  formatValue?: (value: number) => string;
  /** 允许点按中央值输入数字；默认 false。完成或失焦提交有限数字，空/非法草稿不提交。 */
  editable?: boolean;
  /** 受控原始编辑文字；null 表示未编辑，省略时由组件持有。与 onDraftChange 配合使用。 */
  draft?: string | null;
  /** 原文变化；提交数字后请求 null，外部值/范围取消也请求 null；卸载不清外部草稿。 */
  onDraftChange?: (draft: string | null) => void;
  /** 编辑状态；非法草稿保持 true。受控提交接纳 null 后结束，外部取消/卸载立即 false。 */
  onEditingChange?: (editing: boolean) => void;
  /** 整体禁用（三个操作节点都不暴露 action） */
  disabled?: boolean;
  /** E2E / 测试定位 */
  testID?: string;
}

/** 内部编辑实例；原文用于提交，会话身份由所属 hook 创建。 */
export interface StepperEditingSession {
  text: string;
}
