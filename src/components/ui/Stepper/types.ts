/** Stepper 尺寸：xs=24px / sm=28px / md=32px */
export type StepperSize = 'xs' | 'sm' | 'md';

export type StepperProps = {
  /** 当前值（受控） */
  value: number;
  /** 值变化回调（已自动夹到 [min, max] 区间） */
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
  /** 整体禁用（三个操作节点都不暴露 action） */
  disabled?: boolean;
  /** E2E / 测试定位 */
  testID?: string;
};
