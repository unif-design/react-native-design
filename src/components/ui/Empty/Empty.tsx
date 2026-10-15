import { SparkOutlined } from '@unif/react-native-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { r, useColors, useThemedStyles } from '../../../theme';

import { makeStyles } from './styles';
import type { EmptyProps } from './types';

/**
 * 空态 / 占位组件 —— `primaryContainer` 圆盘上的 icon 插画 + 标题 + 描述。
 * icon 默认 `'spark'`(通用空态);相机 / 出错 / 权限场景应显式传强语义 icon。
 */
export function Empty({
  title,
  desc,
  icon = SparkOutlined,
  action,
  accessibilityRole,
  style,
  testID,
}: EmptyProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const Glyph = icon;
  return (
    <View style={[styles.wrap, style]} testID={testID}>
      {Glyph ? (
        <View style={styles.illust}>
          <Glyph size={r(28)} color={c.primary} />
        </View>
      ) : null}
      <Text accessibilityRole={accessibilityRole} style={styles.title}>
        {title}
      </Text>
      {desc ? <Text style={styles.desc}>{desc}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}
