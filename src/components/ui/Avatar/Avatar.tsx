import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useColors } from '../../../theme';
import { paletteFor, sizingFor, styles } from './styles';
import type { AvatarProps } from './types';

/**
 * 圆形头像 —— 5 档尺寸 × 4 种配色 × 可选图片 source。
 *
 * 传 source 且未失败时渲染 Image(onError 后自动 fallback 到 label 文字),
 * 否则渲染 label + variant 背景色。
 */
export function Avatar({
  label,
  size = 'md',
  variant = 'neutral',
  source,
  testID,
}: AvatarProps): React.JSX.Element {
  const c = useColors();
  const [imageFailed, setImageFailed] = useState(false);

  // [M-20] React 18+ 已移除 unmount 后 setState 的 warning,mountedRef 守卫为死码,删除。
  // [L-44] source 变化时重置 imageFailed,否则换图 URL 后仍展示 fallback 文字。
  // source 可能是对象形态({ uri }),按 uri 字段做细粒度比较。
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
  const dims = sizingFor(size);
  const palette = paletteFor(variant, c);

  const showImage = source != null && !imageFailed;

  return (
    <View
      style={[
        styles.base,
        {
          width: dims.box,
          height: dims.box,
          borderRadius: dims.box / 2,
          backgroundColor: palette.bg,
        },
      ]}
      accessible={!!label}
      accessibilityLabel={label}
      testID={testID}
    >
      {showImage ? (
        <Image
          source={source}
          onError={handleImageError}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={[styles.label, { fontSize: dims.fs, color: palette.fg }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </View>
  );
}
