import type { ImageSourcePropType } from 'react-native';
import { isValidImageSource } from '../../../utils/imageSource';

export function selectNativeImageAttemptSource(
  source: unknown
): ImageSourcePropType | undefined {
  return isValidImageSource(source) ? source : undefined;
}

export function selectWebImageAttemptSource(
  source: unknown
): ImageSourcePropType | undefined {
  if (!isValidImageSource(source)) return undefined;

  // RNW 0.21 不解析 native 的 candidate 数组；Web 明确使用第一候选项。
  return Array.isArray(source) ? source[0] : source;
}
