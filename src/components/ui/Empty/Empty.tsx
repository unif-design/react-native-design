import React from 'react';
import { Text, View } from 'react-native';
import { useColors, useThemedStyles } from '../../../theme';
import { Icon } from '../Icon';
import { makeStyles } from './styles';
import type { EmptyProps } from './types';

/**
 * 空态 / 占位组件 —— `primary-0` 圆盘上的 spark 插画 + 标题 + 描述。
 */
export function Empty({ title, desc, testID }: EmptyProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.illust}>
        <Icon name="spark" size={28} color={c.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {desc ? <Text style={styles.desc}>{desc}</Text> : null}
    </View>
  );
}
