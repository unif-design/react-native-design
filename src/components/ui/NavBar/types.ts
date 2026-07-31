import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { IconName } from '../Icon';

export type NavBarAction = {
  icon: IconName;
  onPress: () => void;
  /** 屏幕阅读器读出的非空功能描述。 */
  accessibilityLabel: string;
};

export type NavBarSlot = NavBarAction | ReactNode;

export type NavBarProps = {
  /** 主标题 */
  title: string;
  /** 副标题（可选，主标题下方一行） */
  subtitle?: string;
  /** 左侧槽位：传 NavBarAction 自动用 IconButton 渲染 / 传 ReactNode 自定义 */
  left?: NavBarSlot;
  /** 右侧槽位：同 left */
  right?: NavBarSlot;
  /**
   * 视觉变体，默认 'default'：
   * - `default`：白底 + hairline 底边
   * - `brand`：品牌橙底 + 白字（登录 / 启动场景）
   * - `transparent`：完全透明 + 深字(c.foreground)+ 无 border —— 浮在浅色 hero
   *   渐变之上的子页(我的名片 / 等)。若需白字深色浮层场景,后续加
   *   'transparentLight' variant。
   */
  variant?: 'default' | 'brand' | 'transparent';
  /** 容器附加样式(margin / position 等布局微调)。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
