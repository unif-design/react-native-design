import { StyleSheet } from 'react-native';
import { fw, radius, space, type as t, type ColorTokens } from '../../../theme';
import type { RibbonTone } from './types';

export const makeStyles = (_c: ColorTokens) =>
  StyleSheet.create({
    root: { position: 'relative' },
    visual: { alignItems: 'flex-end' },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: space['3'],
      borderTopLeftRadius: radius.xs,
      borderBottomLeftRadius: radius.xs,
    },
    text: { fontSize: t.micro, fontWeight: fw.medium },
    fold: {
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
    },
  });

export function paletteFor(
  tone: RibbonTone,
  c: ColorTokens
): { bg: string; fg: string; fold: string } {
  switch (tone) {
    case 'brand':
      return { bg: c.primary, fg: c.onPrimary, fold: c.primaryPressed };
    case 'danger':
      return { bg: c.error, fg: c.onError, fold: c.error };
  }
}
