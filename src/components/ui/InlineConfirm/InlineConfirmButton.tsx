import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { ButtonBase } from '../Button/ButtonBase';
import type {
  IconButtonConfirmation,
  IconButtonProps,
} from '../IconButton/types';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import { InlineConfirmContent } from './InlineConfirmContent';
import { styles } from './styles';
import { useInlineConfirmation } from './useInlineConfirmation';

/** IconButton 的可选确认分支，不单独进入公共 API。 */
export function InlineConfirmButton({
  confirmation,
  onPress,
  ...props
}: IconButtonProps & { confirmation: IconButtonConfirmation }) {
  const button = useRef<View>(null);
  const containsTarget = useCallback((target: unknown) => {
    const host = button.current;
    return Boolean(
      host &&
      typeof target === 'object' &&
      target !== null &&
      'contains' in host &&
      typeof host.contains === 'function' &&
      Reflect.apply(host.contains, host, [target])
    );
  }, []);
  const name = normalizeNonBlankText(props.accessibilityLabel);
  const label = normalizeNonBlankText(confirmation.label);
  const loadingLabel =
    props.loading === true
      ? normalizeNonBlankText(confirmation.loadingLabel)
      : undefined;
  const showingLabel = loadingLabel !== undefined;
  const unavailable = props.disabled || !name || !label;
  const { confirming, press } = useInlineConfirmation(
    {
      onConfirm: onPress,
      onPress: confirmation.onRequest,
      onCancel: confirmation.onCancel,
      confirming: confirmation.confirming,
      confirmationKey: confirmation.confirmationKey,
      disabled: unavailable,
      loading: props.loading,
    },
    containsTarget
  );
  return (
    <ButtonBase
      iconButton
      buttonRef={button}
      onPress={press}
      onTouchStart={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      square={!showingLabel && (props.loading || !confirming)}
      variant={props.variant}
      size={props.size}
      surfaceSize={props.surfaceSize}
      loadingSize={props.iconSize}
      disabled={unavailable}
      loading={props.loading}
      showContentWhenLoading={showingLabel}
      accessibilityLabel={loadingLabel ?? (confirming ? label : name)}
      accessibilityHint={props.accessibilityHint}
      accessibilityState={props.accessibilityState}
      style={[(!props.loading || showingLabel) && styles.surface, props.style]}
      testID={props.testID}
    >
      {({ sizing, palette }) => (
        <InlineConfirmContent
          icon={props.icon}
          iconSize={props.iconSize ?? sizing.fs + 4}
          color={props.color ?? palette.fg}
          label={loadingLabel ?? label ?? ''}
          confirming={showingLabel || confirming}
          sizing={sizing}
        />
      )}
    </ButtonBase>
  );
}
