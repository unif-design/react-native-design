import React from 'react';
import { Text, View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { resolveImageSource } from '../../../utils/imageSource';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { ImageAttempt } from '../shared/ImageAttempt';
import { makeStyles } from './styles';
import type { DrawerHeaderProps } from './types';

/**
 * 品牌橙色抽屉头 —— 导航抽屉顶部区(`@react-navigation/drawer` 的 `drawerContent`)。
 * 内容:橙色面板 + 56×56 单字头像 + 名称 + 可选副标题。
 */
export function DrawerHeader({
  name,
  subtitle,
  source,
  style,
  testID,
}: DrawerHeaderProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  // [L-51] 码点级取首字,防 emoji / 代理对被截断为乱码。
  const initial = [...name.trim()][0] ?? '?';
  const resolvedSource = resolveImageSource(source);
  const fallback = <Text style={styles.avatarText}>{initial}</Text>;

  return (
    <View style={[styles.header, style]} testID={testID}>
      <View
        {...A11Y_HIDDEN_PROPS}
        style={[
          styles.avatar,
          resolvedSource !== undefined && styles.avatarImageMode,
        ]}
      >
        {resolvedSource === undefined ? (
          fallback
        ) : (
          <ImageAttempt
            key={resolvedSource.key}
            source={resolvedSource.source}
            fallback={fallback}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
