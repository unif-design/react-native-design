import type { ReactNode } from 'react';

export type FormProps = {
  /** Form 内部内容，通常是若干个 FormGroup / FormRow */
  children: ReactNode;
  /** E2E / 测试定位 */
  testID?: string;
};

export type FormGroupProps = {
  /** 分组标题（uppercase 小标签风格） */
  label?: string;
  /** 该分组下若干个 FormRow */
  children: ReactNode;
  /** E2E / 测试定位 */
  testID?: string;
};

export type FormRowProps = {
  /** 字段标题 */
  label: string;
  /**
   * 字段控件（Input / Select / Switch / Checkbox 等）。
   * [L-31] 约定：传入控件自带 accessibilityLabel / accessibilityRole,
   * 使 SR 能独立播报控件意图,不依赖 FormRow 的 label 文字。
   */
  children: ReactNode;
  /** 必填标记，渲染右上红色星号 */
  required?: boolean;
  /** 错误信息，渲染在控件下方。
   *  [L-31] 错误文本携带 accessibilityLiveRegion="polite",SR 自动播报。 */
  error?: string;
  /** E2E / 测试定位 */
  testID?: string;
};
