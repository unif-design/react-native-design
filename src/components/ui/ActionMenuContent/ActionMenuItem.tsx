import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useColors, useThemedStyles } from '../../../theme';
import { Icon } from '../Icon';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import { useMenuMousePress } from './useMenuMousePress';
import { makeStyles } from './styles';
import type { ActionMenuItemProps } from './types';

export function ActionMenuItem({
  action,
  onPress,
  confirmation = false,
}: ActionMenuItemProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const label = normalizeNonBlankText(action.label);
  const busy = action.loading === true;
  const disabled = action.disabled === true || busy || !label;
  const { mousePressed, ...mouseHandlers } = useMenuMousePress(disabled);
  const danger = action.tone === 'danger';
  const color = danger
    ? confirmation
      ? colors.onError
      : colors.error
    : colors.foreground;
  return (
    <Pressable
      accessible={Boolean(label)}
      accessibilityRole={label ? 'button' : undefined}
      accessibilityLabel={label}
      accessibilityHint={action.accessibilityHint}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      {...mouseHandlers}
      style={({ pressed }) => [
        styles.popoverRow,
        confirmation && styles.popoverConfirmButton,
        confirmation && danger && styles.popoverConfirmDanger,
        (pressed || mousePressed) &&
          (confirmation
            ? styles.popoverConfirmPressed
            : styles.popoverRowPressed),
        disabled && styles.popoverRowDisabled,
      ]}
    >
      {action.icon || busy ? (
        <View
          style={styles.popoverIcon}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {busy ? (
            <ActivityIndicator size="small" color={color} />
          ) : action.icon ? (
            <Icon name={action.icon} size={20} color={color} />
          ) : null}
        </View>
      ) : null}
      <Text
        style={[
          styles.popoverLabel,
          confirmation && styles.popoverConfirmLabel,
          { color },
        ]}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}
