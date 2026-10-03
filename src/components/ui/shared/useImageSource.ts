import { useMemo } from 'react';
import { createImageSourceResolver } from '../../../utils/imageSource';

/** Reuse immutable image inputs without retaining a global source cache. */
export function useImageSource(source: unknown) {
  const resolve = useMemo(createImageSourceResolver, []);
  return resolve(source);
}
