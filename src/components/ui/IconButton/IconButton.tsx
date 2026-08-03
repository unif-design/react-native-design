import React, { useEffect } from 'react';
import { createLogger } from '../../../utils/logger';
import { ButtonBase } from '../Button/ButtonBase';
import { Icon } from '../Icon';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import type { IconButtonProps } from './types';

const log = createLogger('IconButton');

/**
 * Icon-only 按钮 —— 与 Button 共享 ButtonBase chrome。
 *
 * `square=true` 触发 ButtonBase 方形布局(width=height=sizing.h)。
 * Icon 大小由 `sizing.fs + 4` 决定 —— 无文本平衡,稍大于 Button 内 icon(`fs + 2`)。
 *
 * `accessibilityLabel` TypeScript 强制必填 —— icon-only 无文本提示语义,
 * SR 必须靠 a11y label 朗读。
 */
export function IconButton({
  icon,
  onPress,
  size = 'md',
  variant = 'ghost',
  color,
  disabled,
  loading,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  style,
  testID,
}: IconButtonProps): React.JSX.Element {
  const accessibleName = normalizeNonBlankText(accessibilityLabel);
  const hasBlankLabel = accessibleName === undefined;

  useEffect(() => {
    if (hasBlankLabel) {
      log.warn(
        'IconButton accessibilityLabel 不能为空白，当前 action 已禁用。'
      );
    }
  }, [hasBlankLabel]);

  return (
    <ButtonBase
      square
      onPress={onPress}
      size={size}
      variant={variant}
      loading={loading}
      disabled={disabled === true || hasBlankLabel}
      accessibilityLabel={accessibleName}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      style={style}
      testID={testID}
    >
      {({ sizing, palette }) => (
        <Icon name={icon} size={sizing.fs + 4} color={color ?? palette.fg} />
      )}
    </ButtonBase>
  );
}
