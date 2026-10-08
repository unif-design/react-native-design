import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { IconName } from '../Icon';

export interface ActionMenuConfirmation {
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
  cancelLabel?: string;
  onClose(): void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ActionMenuItemProps {
  action: ActionMenuAction;
  onPress(): void;
}

export interface ActionMenuSheetCardProps {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  testID: string;
}
