import type { ReactNode } from 'react';

/** Radio 选项值类型 */
export type Value = string | number;

type AccessibleName =
  | {
      /** 可见旁标同时提供 accessible name；可显式覆盖读屏文案 */
      label: string;
      accessibilityLabel?: string;
    }
  | {
      /** 无可见旁标时必须显式提供 accessible name */
      label?: never;
      accessibilityLabel: string;
    };

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
  /** 单选组自身的读屏名称 */
  accessibilityLabel: string;
  /** 若干个 Radio 子项 */
  children: ReactNode;
  /** E2E / 测试定位 */
  testID?: string;
};

type RadioBehaviorProps = {
  /** 此项的值 */
  value: Value;
  /** 禁用 */
  disabled?: boolean;
  /**
   * E2E / 测试定位。不传时会自动从父 Radio.Group 的 testID 派生为
   * `${groupTestID}-${value}`，业务通常只需在 Radio.Group 上传一次 testID。
   */
  testID?: string;
};

export type RadioProps = RadioBehaviorProps & AccessibleName;
