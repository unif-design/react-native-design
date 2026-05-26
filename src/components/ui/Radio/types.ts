import type { ReactNode } from 'react';

/** Radio 选项值类型 */
export type Value = string | number;

export type GroupContext = {
  /** 当前选中值 */
  value: Value;
  /** 选中变化回调 */
  onChange: (value: Value) => void;
  /** 父组 testID（让 Radio 自动派生 `${groupTestID}-${value}`，业务可不必每个 Radio 单独传） */
  groupTestID?: string;
};

export type GroupProps = {
  /** 当前选中值（受控） */
  value: Value;
  /** 选中变化回调 */
  onChange: (value: Value) => void;
  /** 若干个 Radio 子项 */
  children: ReactNode;
  /** E2E / 测试定位 */
  testID?: string;
};

export type RadioProps = {
  /** 此项的值 */
  value: Value;
  /** 此项右侧文字 */
  label?: string;
  /** 禁用 */
  disabled?: boolean;
  /**
   * E2E / 测试定位。不传时会自动从父 Radio.Group 的 testID 派生为
   * `${groupTestID}-${value}`，业务通常只需在 Radio.Group 上传一次 testID。
   */
  testID?: string;
};
