import React from 'react';
import { Image, View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { makeStyles, RING_EXTRA_RADIUS, sizingFor } from './styles';
import type { ThumbnailProps } from './types';

const log = createLogger('Thumbnail');

/** 缩略图基础组件 —— 列表 / 卡片 / chat 行内通用 16:9.5 小图。
 *
 *  尺寸阶梯:sm / md(默认 113×67)/ lg,与 NewsList / NewsArea 历史一致。
 *  bg 占位 = c.surfaceContainer(图加载中 / 失败时不至于空白)。
 *  `selected` 时外层套 View 画 2pt 品牌色 ring;不选中保持纯 Image 结构。
 *
 *  用法:
 *  - 远程 URL:`<Thumbnail uri={item.coverUrl} />`
 *  - 本地资源:`<Thumbnail source={require('./fallback.png')} />`
 *  - 自定义尺寸:`<Thumbnail uri={...} size="lg" />`
 *  - 选中态:`<Thumbnail uri={...} selected />` */
export function Thumbnail({
  uri,
  source,
  size = 'md',
  selected,
  style,
  resizeMode = 'cover',
  accessibilityLabel,
  testID,
}: ThumbnailProps): React.JSX.Element | null {
  const styles = useThemedStyles(makeStyles);
  if (!uri && !source) {
    // [L-18] uri/source 均未传:一次性告警,返回 null 而非空白区域。
    // types 注释已说明二选一语义;此 warn 用于开发期快速定位漏传。
    log.warn('Thumbnail: uri 和 source 均未提供,组件将渲染为 null');
    return null;
  }
  const dim = sizingFor(size);
  const image = (
    <Image
      source={uri ? { uri } : (source as NonNullable<typeof source>)}
      style={[styles.base, dim, style]}
      resizeMode={resizeMode}
      accessibilityLabel={accessibilityLabel}
      accessible={!!accessibilityLabel}
      testID={selected ? undefined : testID}
    />
  );
  if (!selected) return image;
  // ring 容器:borderRadius 比 image 大 (border + padding) 才能贴合包裹外圈
  return (
    <View
      style={[
        styles.ring,
        { borderRadius: dim.borderRadius + RING_EXTRA_RADIUS },
      ]}
      testID={testID}
    >
      {image}
    </View>
  );
}
