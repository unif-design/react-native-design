import React from 'react';
import { Text, View } from 'react-native';
import { useColors, useThemedStyles } from '../../../theme';
import { makeVersionPillStyles } from './styles';
import type { VersionPillProps } from './types';

/** 版本徽章胶囊 —— success dot + 版本 + 分点 + build mono。 */
export function VersionPill({
  version,
  build,
  statusColor,
  style,
}: VersionPillProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeVersionPillStyles);
  const dotColor = statusColor ?? c.success;
  return (
    <View style={[styles.pill, style]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.version}>版本 {version}</Text>
      {build ? (
        <>
          <Text style={styles.sep}>·</Text>
          <Text style={styles.build}>build {build}</Text>
        </>
      ) : null}
    </View>
  );
}
