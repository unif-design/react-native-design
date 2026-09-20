import { useCallback, useLayoutEffect, useState } from 'react';
import type {
  MultilineLayout,
  MultilineLayoutInput,
  WebTextInputMeasurement,
} from './types';

/** RNW 的 contentSize 使用 scrollHeight，固定高度会阻止缩短，须临时解除高度后测量。 */
export function useMultilineLayout({
  enabled,
  value,
  minHeight,
  maxHeight,
  verticalInset,
  fontSize,
  placeholder,
  inputRef,
}: MultilineLayoutInput): MultilineLayout {
  const [contentHeight, setContentHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const minimum = Math.max(0, minHeight - verticalInset);
  const maximum =
    maxHeight === undefined ? Infinity : Math.max(0, maxHeight - verticalInset);
  useLayoutEffect(() => {
    if (!enabled || inputRef.current === null) return;
    const node = inputRef.current as unknown as WebTextInputMeasurement;
    const { height, minHeight: previousMinimum } = node.style;
    const scrollTop = node.scrollTop;
    node.style.height = '0px';
    node.style.minHeight = '0px';
    const measured = node.scrollHeight;
    node.style.height = height;
    node.style.minHeight = previousMinimum;
    node.scrollTop = scrollTop;
    if (Number.isFinite(measured)) setContentHeight(measured);
  }, [
    enabled,
    value,
    width,
    fontSize,
    placeholder,
    minHeight,
    maxHeight,
    verticalInset,
    inputRef,
  ]);
  const onLayout = useCallback<NonNullable<MultilineLayout['onLayout']>>(
    (event) => setWidth(event.nativeEvent.layout.width),
    []
  );
  return {
    inputStyle: {
      height: Math.min(maximum, Math.max(minimum, contentHeight)),
    },
    scrollEnabled: contentHeight > maximum,
    onLayout,
  };
}
