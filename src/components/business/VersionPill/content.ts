import type { ColorTokens } from '../../../theme';
import { normalizeNonBlankText } from '../../ui/shared/accessibilityName';
import type { VersionStatus } from './types';

type VersionStatusColors = Pick<ColorTokens, 'foregroundMuted' | 'success'>;

type ResolvedVersionStatus = {
  label: string;
  color: string;
  diagnostics: readonly string[];
};

export function resolveVersionStatus(
  status: VersionStatus | undefined,
  colors: VersionStatusColors
): ResolvedVersionStatus {
  if (status == null) {
    return { label: '正常', color: colors.success, diagnostics: [] };
  }
  const label = normalizeNonBlankText(status.label);
  return {
    label: label ?? '状态未知',
    color: status.color ?? colors.foregroundMuted,
    diagnostics: label === undefined ? ['status.label'] : [],
  };
}

type VersionPillLabelContent = {
  version: string;
  build: string | null | undefined;
  statusLabel: string;
  versionPrefix: string;
  buildPrefix: string;
};

export function buildVersionPillLabel({
  version,
  build,
  statusLabel,
  versionPrefix,
  buildPrefix,
}: VersionPillLabelContent): string {
  const versionLabel = `${versionPrefix}${version}`;
  const buildLabel =
    build != null && build !== '' ? `，${buildPrefix}${build}` : '';
  return `${versionLabel}${buildLabel}，${statusLabel}`;
}
