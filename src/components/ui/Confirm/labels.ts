import { normalizeNonBlankText } from '../shared/accessibilityName';
import type { ConfirmOptions } from './types';

export function resolveConfirmLabels(
  options: Pick<ConfirmOptions, 'confirmLabel' | 'cancelLabel'>
): {
  confirmLabel: string;
  cancelLabel: string;
} {
  return {
    confirmLabel: normalizeNonBlankText(options.confirmLabel) ?? '确认',
    cancelLabel: normalizeNonBlankText(options.cancelLabel) ?? '取消',
  };
}
