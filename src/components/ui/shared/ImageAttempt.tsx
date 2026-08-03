import React, { useState } from 'react';
import { Image } from 'react-native';
import type { ImageProps, ImageSourcePropType } from 'react-native';

type ImageAttemptProps = Omit<ImageProps, 'onError' | 'source'> & {
  source: ImageSourcePropType;
  fallback: React.ReactNode;
};

/**
 * 每个 keyed 挂载实例只拥有自己的失败状态。source identity 变化时由父级 key
 * 同步换实例，旧 onError 无法写入新 attempt。
 */
export function ImageAttempt({
  source,
  fallback,
  ...imageProps
}: ImageAttemptProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);

  return failed ? (
    <>{fallback}</>
  ) : (
    <Image {...imageProps} source={source} onError={() => setFailed(true)} />
  );
}
