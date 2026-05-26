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
  /** 字段控件（Input / Select / etc） */
  children: ReactNode;
  /** 必填标记，渲染右上红色星号 */
  required?: boolean;
  /** 错误信息，渲染在控件下方 */
  error?: string;
  /** E2E / 测试定位 */
  testID?: string;
};
