import type { StyleProp, ViewStyle } from 'react-native';

export type VersionPillProps = {
  /** 版本号,如 "2.8.0"。 */
  version: string;
  /** 可选 build 号;为空时省略分点与 build 字。 */
  build?: string;
  /** 状态点颜色,默认 c.success。 */
  statusColor?: string;
  /** 容器附加样式覆盖。 */
  style?: StyleProp<ViewStyle>;
};
