import type { ImageSourcePropType } from 'react-native';
import type { ResolvedImageSource } from '../../../utils/imageSource';

// Input validation belongs to the media component's resolver. Its frozen result
// is safe to select here without reading or serializing the original input again.
export function selectNativeImageAttemptSource(
  resolved: ResolvedImageSource | undefined
): ImageSourcePropType | undefined {
  return resolved?.source;
}

export function selectWebImageAttemptSource(
  resolved: ResolvedImageSource | undefined
): ImageSourcePropType | undefined {
  const source = resolved?.source;

  // RNW 0.21 不解析 native 的 candidate 数组；Web 明确使用第一候选项。
  return Array.isArray(source) ? source[0] : source;
}
