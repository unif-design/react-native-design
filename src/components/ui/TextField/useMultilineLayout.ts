import { useCallback, useLayoutEffect, useState } from 'react';
import { TEXTAREA_VERTICAL_INSET } from './constants';
import type { MultilineLayout, MultilineLayoutInput } from './types';

/** 原生 contentSize 是输入内容测量；边框和外部 padding 只计算一次。 */
export function useMultilineLayout({
  value,
  minHeight,
  maxHeight,
}: MultilineLayoutInput): MultilineLayout {
  const [contentHeight, setContentHeight] = useState(0);
  const minimum = Math.max(0, minHeight - TEXTAREA_VERTICAL_INSET);
  const maximum =
    maxHeight === undefined
      ? Infinity
      : Math.max(0, maxHeight - TEXTAREA_VERTICAL_INSET);
  // 外部清空立即回到最小值，不等待原生异步测量，且不重挂输入/丢失焦点。
  useLayoutEffect(() => {
    if (value.length === 0) setContentHeight(0);
  }, [value]);
  const onContentSizeChange = useCallback<
    MultilineLayout['onContentSizeChange']
  >((event) => {
    const height = event.nativeEvent.contentSize.height;
    if (Number.isFinite(height) && height >= 0) setContentHeight(height);
  }, []);
  return {
    height: Math.min(maximum, Math.max(minimum, contentHeight)),
    scrollEnabled: contentHeight > maximum,
    onContentSizeChange,
  };
}
