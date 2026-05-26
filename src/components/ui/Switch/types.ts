export type SwitchProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  /** 用于无障碍 / 测试 */
  accessibilityLabel?: string;
  testID?: string;
};
