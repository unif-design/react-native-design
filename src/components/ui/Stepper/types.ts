/** Stepper 尺寸：sm=28px / md=32px */
export type StepperSize = 'sm' | 'md';

export type StepperProps = {
  /** 当前值（受控） */
  value: number;
  /** 值变化回调（已自动夹到 [min, max] 区间） */
  onChange: (value: number) => void;
  /** 最小值，默认 0 */
  min?: number;
  /** 最大值，默认 99 */
  max?: number;
  /** 增减步长，默认 1；非正数会回退为 1 */
  step?: number;
  /** 尺寸，默认 'md' */
  size?: StepperSize;
  /** 整体禁用（两个按钮都不可点） */
  disabled?: boolean;
  /** E2E / 测试定位 */
  testID?: string;
};
