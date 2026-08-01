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

type CheckboxBehaviorProps = {
  /** 当前选中状态（受控） */
  checked: boolean;
  /** 状态变化回调，传入新的 checked 值 */
  onChange: (checked: boolean) => void;
  /** 形状,默认方形;'circle' 用于需要强调的必勾项(如协议同意) */
  shape?: 'square' | 'circle';
  /** 禁用 */
  disabled?: boolean;
  /** E2E / 测试定位 */
  testID?: string;
};

export type CheckboxProps = CheckboxBehaviorProps & AccessibleName;
