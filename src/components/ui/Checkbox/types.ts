export type CheckboxProps = {
  /** 当前选中状态（受控） */
  checked: boolean;
  /** 状态变化回调，传入新的 checked 值 */
  onChange: (checked: boolean) => void;
  /** 旁标文字（不传则只渲染勾选方框） */
  label?: string;
  /** 形状,默认方形;'circle' 用于需要强调的必勾项(如协议同意) */
  shape?: 'square' | 'circle';
  /** 禁用 */
  disabled?: boolean;
  /** E2E / 测试定位 */
  testID?: string;
};
