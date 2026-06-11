import type { StyleProp, ViewStyle } from 'react-native';

export type VersionPillProps = {
  /** 版本号,如 "2.8.0"。 */
  version: string;
  /** 可选 build 号;值为 null/undefined/"" 时省略分点与 build 字。 */
  build?: string;
  /** 状态点颜色,默认 c.success。 */
  statusColor?: string;
  /**
   * 版本号前缀文案,默认 "版本 "。
   * 消费者可传 "v" / "Version " 等覆盖(含末尾空格)。
   */
  versionPrefix?: string;
  /**
   * build 号前缀文案,默认 "build "。
   * 消费者可传 "Build " / "#" 等覆盖。
   */
  buildPrefix?: string;
  /** 容器附加样式覆盖。 */
  style?: StyleProp<ViewStyle>;
};
