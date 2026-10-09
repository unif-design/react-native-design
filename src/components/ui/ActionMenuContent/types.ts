import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { IconName } from '../Icon';

export interface ActionMenuConfirmation {
  title?: string;
  message: string;
  confirmLabel: string;
}

export interface ActionMenuAction {
  id: string;
  label: string;
  icon?: IconName;
  accessibilityHint?: string;
  onPress(): void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'neutral' | 'danger';
  confirmation?: ActionMenuConfirmation;
}

/** 操作、确认有效性和宿主关闭由调用方负责。 */
export interface ActionMenuContentProps {
  actions: readonly ActionMenuAction[];
  presentation?: 'dialog' | 'sheet' | 'popover';
  title?: string;
  /** null 隐藏取消操作，宿主仍须提供点外／返回关闭。 */
  cancelLabel?: string | null;
  /** 指针中心相对卡片左边的坐标；仅 popover 绘制，不负责宿主定位。 */
  pointer?: { edge: 'top' | 'bottom'; offset: number };
  onConfirmationChange?(actionId: string | null): void;
  onClose(): void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ActionMenuItemProps {
  confirmation?: boolean;
  action: ActionMenuAction;
  onPress(): void;
}

export interface ActionMenuSheetCardProps {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  testID: string;
}

export interface ActionMenuPopoverCardProps {
  children: ReactNode;
  pointer?: ActionMenuContentProps['pointer'];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID: string;
}
