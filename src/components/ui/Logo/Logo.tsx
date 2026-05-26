import React from 'react';
import { Image } from 'react-native';
import type { LogoProps } from './types';

// Native/Metro:require() 返回 asset 数字 ID;Web/webpack:返回 URL 字符串,
// 但 RN-Web Image 不解析 webpack URL,所以走 docusaurus 镜像的 `/img/logo.png` 公开路径。
const RAW_SOURCE = require('@/assets/logo.png');
const SOURCE: number | { uri: string } =
  typeof RAW_SOURCE === 'string' ? { uri: '/img/logo.png' } : RAW_SOURCE;

/**
 * Unif 主品牌标 —— 1024×1024 RGBA PNG。
 *
 * **不要重画 / 改色 / 描边 / 加阴影**,品牌标准图。
 * 最小尺寸 24×24,更小请改用 `static/img/favicon.svg`。
 */
export function Logo({
  size = 64,
  borderRadius,
  label = 'Unif',
  style,
  testID,
}: LogoProps): React.JSX.Element {
  return (
    <Image
      source={SOURCE}
      accessibilityLabel={label}
      style={[
        {
          width: size,
          height: size,
          borderRadius: borderRadius ?? size / 4,
        },
        style,
      ]}
      resizeMode="cover"
      testID={testID}
    />
  );
}
