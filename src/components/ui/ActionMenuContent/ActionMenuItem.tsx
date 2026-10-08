import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useColors, useThemedStyles } from '../../../theme';
import { Icon } from '../Icon';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import { useMenuMousePress } from './useMenuMousePress';
import { makeStyles } from './styles';
import type { ActionMenuItemProps } from './types';

export function ActionMenuItem({ action, onPress }: ActionMenuItemProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const label = normalizeNonBlankText(action.label);
  const busy = action.loading === true;
  const disabled = action.disabled === true || busy || !label;
  const { mousePressed, ...mouseHandlers } = useMenuMousePress(disabled);
  const color = action.tone === 'danger' ? colors.error : colors.foreground;
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
        (pressed || mousePressed) && styles.popoverRowPressed,
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
            <ActivityIndicator size="small" color={colors.foregroundMuted} />
          ) : action.icon ? (
            <Icon name={action.icon} size={20} color={color} />
          ) : null}
        </View>
      ) : null}
      <Text
        style={[
          styles.popoverLabel,
          action.tone === 'danger' && styles.popoverDanger,
        ]}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}
