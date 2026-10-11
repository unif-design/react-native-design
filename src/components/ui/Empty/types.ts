import type { ComponentType } from 'react';
import type { IconProps } from '@unif/react-native-icons';
import type { StyleProp, ViewStyle } from 'react-native';

export type EmptyProps = {
  /** 主标题（如「暂无数据」） */
  title: string;
  /** 副描述（建议下一步操作） */
  desc?: string;
  /** illust 圆盘内的图标,默认 `'spark'`(通用空态)。
   *  相机域可传 `'camera-off'` / `'permission-denied'` / `'error-alert'` 等强语义 icon。 */
  icon?: ComponentType<IconProps>;
  /** 容器附加样式(margin / position 等布局微调)。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
