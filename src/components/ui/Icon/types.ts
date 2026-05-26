import type { StyleProp, ViewStyle } from 'react-native';
import type { IconName } from '../../../icons';

export type { IconName };

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  /** 覆盖描边宽度（默认按每个图标自带值，多数 1.75，少数 2） */
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位（挂在外层 View） */
  testID?: string;
};
