import type { StyleProp, ViewStyle } from 'react-native';
import type { IconName } from '../Icon';

export type TabBarItem = {
  id: string;
  icon: IconName;
  label: string;
  /** 图标右上角的数字角标（用 string 才能写 '99+'） */
  badge?: number | string;
  /** 单 tab 的 testID（不传则用 `${barTestID}-${id}`） */
  testID?: string;
};

export type TabBarProps = {
  active: string;
  onChange: (id: string) => void;
  items: TabBarItem[];
  /** 容器附加样式(margin / position 等布局微调)。 */
  style?: StyleProp<ViewStyle>;
  /** 容器 testID；item testID 自动派生为 `${testID}-${id}` */
  testID?: string;
};
