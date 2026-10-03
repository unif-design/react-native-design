import type { StyleProp, ViewStyle } from 'react-native';

export interface ActionMenuConfirmation {
  message: string;
  confirmLabel: string;
}

export interface ActionMenuAction {
  id: string;
  label: string;
  onPress(): void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'neutral' | 'danger';
  confirmation?: ActionMenuConfirmation;
}

/** 操作、确认有效性和宿主关闭由调用方负责。 */
export interface ActionMenuContentProps {
  actions: readonly ActionMenuAction[];
  presentation?: 'dialog' | 'sheet';
  title?: string;
  cancelLabel?: string;
  onClose(): void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
