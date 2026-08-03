import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { Icon } from '../Icon';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import { ButtonBase } from './ButtonBase';
import { makeStyles } from './styles';
import type { ButtonProps } from './types';

const log = createLogger('Button');

/**
 * 7 variant × 3 size 文本按钮。
 * 内部组合 ButtonBase + content(label + 可选 leftIcon / rightIcon),
 * ButtonBase 接管 chrome(sizing / palette / disabled / loading / a11y)。
 *
 * `loading=true` 时 ButtonBase 把 children render prop 短路为 ActivityIndicator。
 */
export function Button({
  label,
  onPress,
  size,
  variant,
  block,
  disabled,
  loading,
  leftIcon,
  rightIcon,
  style,
  testID,
  accessibilityHint,
  accessibilityState,
}: ButtonProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  const accessibleName = normalizeNonBlankText(label);
  const hasBlankLabel = accessibleName === undefined;

  useEffect(() => {
    if (hasBlankLabel) {
      log.warn('Button label 不能为空白，当前 action 已禁用。');
    }
  }, [hasBlankLabel]);

  return (
    <ButtonBase
      onPress={onPress}
      size={size}
      variant={variant}
      block={block}
      disabled={disabled === true || hasBlankLabel}
      loading={loading}
      accessibilityLabel={accessibleName}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      style={style}
      testID={testID}
    >
      {({ sizing, palette }) => (
        <>
          {leftIcon ? (
            <Icon name={leftIcon} size={sizing.fs + 2} color={palette.fg} />
          ) : null}
          <Text
            style={[styles.label, { color: palette.fg, fontSize: sizing.fs }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {rightIcon ? (
            <Icon name={rightIcon} size={sizing.fs + 2} color={palette.fg} />
          ) : null}
        </>
      )}
    </ButtonBase>
  );
}
