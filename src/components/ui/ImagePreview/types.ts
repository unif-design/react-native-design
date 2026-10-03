import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

export interface ImagePreviewItem {
  id: string;
  source?: ImageSourcePropType;
  label?: string;
  canDelete?: boolean;
  deleting?: boolean;
}

export interface ImagePreviewProps {
  items: readonly ImagePreviewItem[];
  width: number;
  height: number;
  initialId?: string;
  onCurrentChange?(item: Readonly<ImagePreviewItem>): void;
  onRequestDelete?(item: Readonly<ImagePreviewItem>): void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ImagePreviewHandle {
  scrollTo(id: string, animated?: boolean): void;
  getCurrent(): Readonly<ImagePreviewItem> | undefined;
}

export interface ImagePreviewSelection {
  items: readonly ImagePreviewItem[];
  index: number;
  initialized: boolean;
  carouselRevision: number;
}

export interface ImagePreviewScrollRequest {
  id: string;
  animated: boolean;
}
