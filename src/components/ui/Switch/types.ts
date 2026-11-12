export type SwitchProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  /** 控件名称；状态文字只描述当前值。 */
  accessibilityLabel: string;
  /** 可选的轨道内状态短文案，开启显示 on，关闭显示 off。 */
  stateLabels?: Readonly<{ on: string; off: string }>;
  disabled?: boolean;
  testID?: string;
};
