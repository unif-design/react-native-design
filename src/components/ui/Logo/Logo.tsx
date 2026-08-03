import React, { useEffect, useRef } from 'react';
import { Image } from 'react-native';
import { r } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import type { LogoProps } from './types';

const log = createLogger('Logo');

/**
 * 品牌 logo 容器组件 —— 提供尺寸 / 圆角 / a11y 标准化包装。
 *
 * 不持有任何品牌资产。consumer 通过 `source` prop 传入自己品牌的图片
 * (推荐 1024×1024 RGBA PNG / SVG 转 png)。
 *
 * @example
 * <Logo source={require('@/assets/logo.png')} size={64} accessibilityLabel="Unif" />
 */
export function Logo({
  source,
  size = r(64),
  borderRadius,
  accessibilityLabel,
  style,
  testID,
}: LogoProps): React.JSX.Element {
  const warnedBlankLabelRef = useRef(false);
  const normalizedLabel = accessibilityLabel?.trim();
  const hasBlankLabel = accessibilityLabel != null && normalizedLabel === '';

  useEffect(() => {
    if (__DEV__ && hasBlankLabel && !warnedBlankLabelRef.current) {
      warnedBlankLabelRef.current = true;
      log.warn('accessibilityLabel 不能为空白，当前 Logo 已按装饰图片处理');
    }
  }, [hasBlankLabel]);

  const accessibilityProps = normalizedLabel
    ? {
        accessible: true,
        accessibilityLabel: normalizedLabel,
        accessibilityRole: 'image' as const,
      }
    : A11Y_HIDDEN_PROPS;

  return (
    <Image
      {...accessibilityProps}
      source={source}
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
