import React from 'react';
import { Image } from 'react-native';
import { useThemedStyles } from '@/theme';
import { makeStyles, sizingFor } from './styles';
import type { ThumbnailProps } from './types';

/** 缩略图基础组件 —— 列表 / 卡片 / chat 行内通用 16:9.5 小图。
 *
 *  尺寸阶梯:sm / md(默认 113×67)/ lg,与 NewsList / NewsArea 历史一致。
 *  bg 占位 = c.surfaceContainer(图加载中 / 失败时不至于空白)。
 *
 *  用法:
 *  - 远程 URL:`<Thumbnail uri={item.coverUrl} />`
 *  - 本地资源:`<Thumbnail source={require('./fallback.png')} />`
 *  - 自定义尺寸:`<Thumbnail uri={...} size="lg" />` */
export function Thumbnail({
  uri,
  source,
  size = 'md',
  style,
  resizeMode = 'cover',
  accessibilityLabel,
  testID,
}: ThumbnailProps): React.JSX.Element | null {
  const styles = useThemedStyles(makeStyles);
  if (!uri && !source) return null;
  const dim = sizingFor(size);
  return (
    <Image
      source={uri ? { uri } : (source as NonNullable<typeof source>)}
      style={[styles.base, dim, style]}
      resizeMode={resizeMode}
      accessibilityLabel={accessibilityLabel}
      accessible={!!accessibilityLabel}
      testID={testID}
    />
  );
}
