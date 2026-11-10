import { StyleSheet } from 'react-native';
import { fixed, radius, space } from '../../../theme';

export const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    minHeight: fixed.hitTarget,
    paddingHorizontal: space[1],
    borderRadius: radius.pill,
  },
  glass: { borderRadius: radius.pill },
});
