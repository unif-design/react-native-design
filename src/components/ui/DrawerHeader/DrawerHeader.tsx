import React, { useEffect, useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme';
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
  testID,
}: DrawerHeaderProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  const [imageFailed, setImageFailed] = useState(false);
  // 避免 unmount 后 Image 网络回包仍调 setState 的 React warning
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );
  const handleImageError = () => {
    if (mountedRef.current) setImageFailed(true);
  };
  const initial = name.trim()[0] ?? '?';
  const showImage = source != null && !imageFailed;
  return (
    <View style={styles.header} testID={testID}>
      <View style={[styles.avatar, showImage && styles.avatarImageMode]}>
        {showImage ? (
          <Image
            source={source}
            onError={handleImageError}
            style={styles.avatarImage}
            resizeMode="cover"
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
