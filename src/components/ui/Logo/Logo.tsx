import React from 'react';
import { Image } from 'react-native';
import { r } from '../../../theme';
import type { LogoProps } from './types';

/**
 * 品牌 logo 容器组件 —— 提供尺寸 / 圆角 / a11y 标准化包装。
 *
 * 不持有任何品牌资产。consumer 通过 `source` prop 传入自己品牌的图片
 * (推荐 1024×1024 RGBA PNG / SVG 转 png)。
 *
 * @example
 * <Logo source={require('@/assets/logo.png')} size={64} label="Unif" />
 */
export function Logo({
  source,
  size = r(64),
  borderRadius,
  label = 'Logo',
  style,
  testID,
}: LogoProps): React.JSX.Element {
  return (
    <Image
      source={source}
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
