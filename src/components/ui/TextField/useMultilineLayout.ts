import { TEXTAREA_VERTICAL_INSET } from './constants';
import type { MultilineLayout, MultilineLayoutInput } from './types';

/** 原生 Yoga 直接测量文本；固定 height 会阻断 iOS Fabric 的后续内容尺寸通知。 */
export function useMultilineLayout({
  minHeight,
  maxHeight,
}: MultilineLayoutInput): MultilineLayout {
  return {
    inputStyle: {
      minHeight: Math.max(0, minHeight - TEXTAREA_VERTICAL_INSET),
      maxHeight:
        maxHeight === undefined
          ? undefined
          : Math.max(0, maxHeight - TEXTAREA_VERTICAL_INSET),
    },
    // 原生仅在内容溢出时滚动；min=max 时也不等待不会再变化的框高事件。
    scrollEnabled: true,
  };
}
