import type { MultilineLayout, MultilineLayoutInput } from './types';

/** Android 继续由原生 Yoga 测量；iOS 使用对应平台的独立文字测量。 */
export function useMultilineLayout({
  minHeight,
  maxHeight,
  verticalInset,
}: MultilineLayoutInput): MultilineLayout {
  return {
    inputStyle: {
      minHeight: Math.max(0, minHeight - verticalInset),
      maxHeight:
        maxHeight === undefined
          ? undefined
          : Math.max(0, maxHeight - verticalInset),
    },
    // 原生仅在内容溢出时滚动；min=max 时也不等待不会再变化的框高事件。
    scrollEnabled: true,
  };
}
