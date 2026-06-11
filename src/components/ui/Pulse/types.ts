import type { StyleProp, ViewStyle } from 'react-native';

export type PulseOptions = {
  /** 透明度下界（默认 0.6） */
  from?: number;
  /** 透明度上界（默认 1） */
  to?: number;
  /** 半周期时长（毫秒，默认 700） */
  duration?: number;
  /** 首次周期之前的延迟（默认 0） */
  delay?: number;
};

export type PulseDotProps = PulseOptions & {
  size?: number;
  color?: string;
  /** 容器附加样式(margin / position 等布局微调)。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};

export type PulseProps = PulseOptions & {
  /** 容器附加样式(margin / position 等布局微调)。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
