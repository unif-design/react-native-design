import { StyleSheet } from 'react-native';
import { fw, radius, space, type as t, type ColorTokens } from '../../../theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    pressable: { alignSelf: 'flex-start' },
    content: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[2],
      paddingHorizontal: space[5],
      paddingVertical: space[3],
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.outline,
      borderRadius: radius.pill,
      alignSelf: 'flex-start',
    },
    chipOn: {
      borderColor: c.primary,
      backgroundColor: c.primaryContainerSubtle,
    },
    glass: { backgroundColor: 'transparent', borderColor: 'transparent' },
    glassOn: { borderColor: c.primary },
    text: {
      fontSize: t.xs,
      color: c.foreground,
      fontWeight: fw.regular,
    },
    textOn: {
      color: c.primary,
    },
  });
