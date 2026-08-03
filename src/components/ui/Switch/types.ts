export type SwitchProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  /** Switch 没有内置可见文字，必须显式提供读屏名称 */
  accessibilityLabel: string;
  disabled?: boolean;
  testID?: string;
};
