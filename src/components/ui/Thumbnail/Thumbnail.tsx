import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors, useThemedStyles } from '../../../theme';
import { resolveImageSource } from '../../../utils/imageSource';
import { createLogger } from '../../../utils/logger';
import { ImageAttempt } from '../shared/ImageAttempt';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { sanitizeThumbnailImageStyle } from './normalize';
import { makeStyles, sizingFor } from './styles';
import type { ThumbnailProps } from './types';

const log = createLogger('Thumbnail');
const hasOwn = (value: object, key: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

/**
 * 稳定两层缩略图：outer 只管 caller layout，inner visual frame 固定尺寸并始终
 * 保留 ring。无效 / 加载失败 source 只显示 frame placeholder，不改变布局结构。
 */
export function Thumbnail(props: ThumbnailProps): React.JSX.Element {
  const {
    uri,
    source,
    size = 'md',
    selected,
    containerStyle,
    imageStyle,
    resizeMode = 'cover',
    accessibilityLabel,
    testID,
  } = props;
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const dim = sizingFor(size);
  const hasUri = hasOwn(props, 'uri');
  const hasSource = hasOwn(props, 'source');
  const sourceCandidate =
    hasUri !== hasSource
      ? hasUri && typeof uri === 'string'
        ? { uri: uri.trim() }
        : source
      : undefined;
  const resolvedSource = resolveImageSource(sourceCandidate);
  const sanitizedImageStyle = sanitizeThumbnailImageStyle(imageStyle);
  const diagnostics = [
    ...(resolvedSource === undefined ? ['source'] : []),
    ...sanitizedImageStyle.diagnostics.map((field) =>
      field === 'style' ? 'imageStyle' : `imageStyle.${field}`
    ),
  ];
  const diagnosticKey = diagnostics.join(',');

  useEffect(() => {
    if (__DEV__ && diagnosticKey.length > 0) {
      log.warn(`Thumbnail: 非法运行时输入(${diagnosticKey})已回退。`);
    }
  }, [diagnosticKey]);

  const normalizedLabel =
    typeof accessibilityLabel === 'string'
      ? accessibilityLabel.trim()
      : undefined;
  const imageAccessibilityProps =
    normalizedLabel && normalizedLabel.length > 0
      ? {
          accessible: true,
          accessibilityLabel: normalizedLabel,
          accessibilityRole: 'image' as const,
        }
      : A11Y_HIDDEN_PROPS;
  const ringStyle = {
    borderRadius: dim.borderRadius,
    borderColor: selected ? colors.primary : 'transparent',
  };

  return (
    <View style={containerStyle} testID={testID}>
      <View style={[styles.visualFrame, dim]}>
        {resolvedSource === undefined ? null : (
          <ImageAttempt
            {...imageAccessibilityProps}
            key={resolvedSource.key}
            source={resolvedSource.source}
            fallback={null}
            style={[sanitizedImageStyle.style, StyleSheet.absoluteFill]}
            resizeMode={resizeMode}
          />
        )}
        <View
          {...A11Y_HIDDEN_PROPS}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.ring, ringStyle]}
        />
      </View>
    </View>
  );
}
