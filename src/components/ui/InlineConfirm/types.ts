import type { ViewProps } from 'react-native';

export interface InlineConfirmationOptions {
  onConfirm(): void;
  onPress?: () => void;
  onCancel?: () => void;
  confirming?: boolean;
  confirmationKey?: string | number;
  disabled?: boolean;
  loading?: boolean;
}

/** 只协调树内原位确认与点外取消，不创建弹层或遮挡其它操作。 */
export type InlineConfirmScopeProps = ViewProps;

export interface InlineConfirmOwner {
  cancel(): void;
  containsTarget(target: unknown): boolean;
}

export interface InlineConfirmCoordinator {
  claim(owner: InlineConfirmOwner): void;
  release(owner: InlineConfirmOwner): void;
  cancel(): void;
}
