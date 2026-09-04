import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type BorderBeamProps = {
  /** 被流光描边包围的内容。 */
  children: ReactNode;
  /** 是否显示并运行动画，默认 true。 */
  active?: boolean;
  /** 流光颜色，默认主题 primary。 */
  color?: string;
  /** 绕边一周的时长（毫秒），默认 2400。 */
  duration?: number;
  /** 描边宽度，默认 2。 */
  lineWidth?: number;
  /** 流光段长度（布局单位），默认 40。 */
  size?: number;
  /** 圆角半径，默认 radius.md。 */
  borderRadius?: number;
  /** 外层布局样式。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位。 */
  testID?: string;
};
