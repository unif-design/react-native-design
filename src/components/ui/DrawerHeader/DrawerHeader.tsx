import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useThemedStyles } from '../../../theme';
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
  const [imageFailed, setImageFailed] = useState(false);

  // [M-20] React 18+ 已移除 unmount 后 setState 的 warning,mountedRef 守卫为死码,删除。
  // [L-44] source 变化时重置 imageFailed,否则换图 URL 后仍展示 fallback 文字。
  const uri =
    source != null && typeof source === 'object' && 'uri' in source
      ? (source as { uri?: string }).uri
      : null;
  useEffect(() => {
    setImageFailed(false);
  }, [uri, source]);

  const handleImageError = () => {
    setImageFailed(true);
  };
  // [L-51] 码点级取首字,防 emoji / 代理对被截断为乱码。
  const initial = [...name.trim()][0] ?? '?';
  const showImage = source != null && !imageFailed;
  return (
    <View style={[styles.header, style]} testID={testID}>
      <View style={[styles.avatar, showImage && styles.avatarImageMode]}>
        {showImage ? (
          <Image
            source={source}
            onError={handleImageError}
            style={styles.avatarImage}
            resizeMode="cover"
            accessible={!!name}
            accessibilityLabel={name}
          />
        ) : (
          <Text style={styles.avatarText}>{initial}</Text>
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
