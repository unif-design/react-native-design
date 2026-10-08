import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, useThemedStyles } from '../../../theme';
import { makeStyles } from './styles';
import type { ActionMenuSheetCardProps } from './types';

export function ActionMenuSheetCard({
  children,
  contentStyle,
  testID,
}: ActionMenuSheetCardProps) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessible={false}
      testID={testID}
      style={[
        styles.sheetCard,
        { paddingBottom: insets.bottom + space[5] },
        contentStyle,
      ]}
      onPress={(event) => event.stopPropagation()}
    >
      {children}
    </Pressable>
  );
}
