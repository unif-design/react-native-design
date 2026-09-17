import { r } from '../../../theme';
import type { ThumbnailDimensions, ThumbnailSize } from './types';

export const THUMBNAIL_DIMENSIONS: Readonly<
  Record<ThumbnailSize, Required<ThumbnailDimensions>>
> = {
  sm: { width: r(64), height: r(40), borderRadius: r(6) },
  md: { width: r(113), height: r(67), borderRadius: r(8) },
  lg: { width: r(160), height: r(96), borderRadius: r(10) },
};

export const RESERVED_IMAGE_STYLE_KEYS = [
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
] as const;
