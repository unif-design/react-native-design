import React from 'react';
import { View } from 'react-native';
import { useColors } from '../../../theme';
import { GlassLayer } from '../GlassLayer';
import { styles } from './styles';
import type { IconGroupProps } from './types';

/** 共用一层玻璃材质；子按钮保留独立命中区，并使用无底色变体。 */
export function IconGroup({
  children,
  testID,
}: IconGroupProps): React.JSX.Element {
  const colors = useColors();
  return (
    <View style={styles.root} testID={testID}>
      <GlassLayer
        fallbackColor={colors.surfaceContainerHigh}
        style={styles.glass}
        testID={testID ? `${testID}-glass` : undefined}
      />
      {children}
    </View>
  );
}
