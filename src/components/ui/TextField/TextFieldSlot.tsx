import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useColors, useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { Icon } from '../Icon';
import { normalizeSlotIconSize } from './normalize';
import { makeStyles } from './styles';
import type { TextFieldSlot as TextFieldSlotConfig } from './types';

const log = createLogger('TextFieldSlot');

type TextFieldSlotProps = {
  slot: TextFieldSlotConfig | undefined;
  effectiveEditable: boolean;
  testID?: string;
};

/**
 * 受控 slot renderer。展示内容与真实操作在这里分叉,避免未知 ReactNode 绕过
 * 44pt action frame 或可访问名称约束。
 */
export function TextFieldSlot({
  slot,
  effectiveEditable,
  testID,
}: TextFieldSlotProps): React.JSX.Element | null {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const iconSize =
    slot?.kind === 'icon' ? normalizeSlotIconSize(slot.size) : undefined;
  const iconDiagnosticKey = iconSize?.diagnostics.join(',') ?? '';

  useEffect(() => {
    if (iconDiagnosticKey.length > 0) {
      log.warn('slot.icon.size 非法，已回退为 18。');
    }
  }, [iconDiagnosticKey]);

  if (!slot) return null;

  switch (slot.kind) {
    case 'icon':
      return (
        <View {...A11Y_HIDDEN_PROPS} style={styles.slotDisplay} testID={testID}>
          <Icon
            name={slot.icon}
            size={iconSize?.value ?? 18}
            color={slot.color ?? colors.foregroundMuted}
          />
        </View>
      );
    case 'text':
      return (
        <Text
          {...A11Y_HIDDEN_PROPS}
          style={[styles.slotDisplay, styles.slotText]}
          testID={testID}
        >
          {slot.value}
        </Text>
      );
    case 'action': {
      const disabled = !effectiveEditable || slot.disabled === true;
      return (
        <Pressable
          onPress={disabled ? undefined : slot.onPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={slot.accessibilityLabel}
          accessibilityState={{ disabled }}
          style={styles.actionFrame}
          testID={testID}
        >
          <Icon name={slot.icon} size={18} color={colors.foregroundMuted} />
        </Pressable>
      );
    }
  }
}
