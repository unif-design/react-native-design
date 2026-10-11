import type { ComponentType } from 'react';
import type { IconProps } from '@unif/react-native-icons';
import type { StyleProp, ViewStyle } from 'react-native';

export type EntryCardProps = {
  /** 左侧 icon tile 内的图标组件 */
  icon: ComponentType<IconProps>;
  /** 主标题(rf(13)+0.5 medium，随设备缩放) */
  title: string;
  /** 副标题(rf(11) muted，随设备缩放),省略不渲染该行 */
  sub?: string;
  /** 点击回调,未传不挂 Pressable */
  onPress?: () => void;
  /** 外层附加样式 —— 常用于 grid 列设 `flex: 1` */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
