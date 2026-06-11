import type { ReactNode } from 'react';
import type { IconName } from '../Icon';

export type NavBarSlotConfig = {
  icon: IconName;
  onPress?: () => void;
  /** 屏幕阅读器读出的功能描述。强烈建议传 —— icon-only 按钮无文字,缺省时 SR 回退
   *  读英文 icon 名(如 "menu")且 dev 下告警。请传人类可读短语(如「返回」「更多」)。 */
  accessibilityLabel?: string;
};

export type NavBarProps = {
  /** 主标题 */
  title: string;
  /** 副标题（可选，主标题下方一行） */
  subtitle?: string;
  /** 左侧槽位：传 NavBarSlotConfig 自动用 IconButton 渲染 / 传 ReactNode 自定义 */
  left?: ReactNode | NavBarSlotConfig;
  /** 右侧槽位：同 left */
  right?: ReactNode | NavBarSlotConfig;
  /**
   * 视觉变体，默认 'default'：
   * - `default`：白底 + hairline 底边
   * - `brand`：品牌橙底 + 白字（登录 / 启动场景）
   * - `transparent`：完全透明 + 深字(c.foreground)+ 无 border —— 浮在浅色 hero
   *   渐变之上的子页(我的名片 / 等)。若需白字深色浮层场景,后续加
   *   'transparentLight' variant。
   */
  variant?: 'default' | 'brand' | 'transparent';
  /** E2E / 测试定位 */
  testID?: string;
};
