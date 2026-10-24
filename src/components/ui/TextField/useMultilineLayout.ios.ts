import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { MultilineLayout, MultilineLayoutInput } from './types';

/** 文字独立测量不依赖 TextInput 框高变化，保留同一原生输入实例。 */
export function useMultilineLayout({
  enabled,
  value,
  minHeight,
  maxHeight,
  verticalInset,
  fontSize,
  placeholder,
  allowFontScaling,
  maxFontSizeMultiplier,
  lineBreakStrategyIOS,
}: MultilineLayoutInput): MultilineLayout {
  const [width, setWidth] = useState(0);
  const text = value || placeholder || '\u200B';
  // Text 的末尾空行需要零宽字符参与原生行测量，不写入 TextInput 原值。
  const measuringText = /[\n\r\u2028\u2029]$/.test(text)
    ? `${text}\u200B`
    : text;
  const key = JSON.stringify([
    enabled,
    measuringText,
    width,
    fontSize,
    allowFontScaling,
    maxFontSizeMultiplier,
    lineBreakStrategyIOS,
  ]);
  const latest = useRef(key);
  useLayoutEffect(() => {
    latest.current = key;
  }, [key]);
  const [measured, setMeasured] = useState<{
    key: string;
    height: number;
  }>();
  const onLayout = useCallback<NonNullable<MultilineLayout['onLayout']>>(
    (event) => {
      const next = event.nativeEvent.layout.width;
      if (Number.isFinite(next) && next >= 0) setWidth(next);
    },
    []
  );
  const onTextLayout = useCallback<
    NonNullable<MultilineLayout['measurement']>['onTextLayout']
  >(
    (event) => {
      if (latest.current !== key) return;
      const bottom = event.nativeEvent.lines.reduce(
        (end, line) => Math.max(end, line.y + line.height),
        0
      );
      if (!Number.isFinite(bottom) || bottom <= 0) return;
      const height = Math.ceil(bottom);
      setMeasured((previous) =>
        previous?.key === key && previous.height === height
          ? previous
          : { key, height }
      );
    },
    [key]
  );
  const minimum = Math.max(0, minHeight - verticalInset);
  const maximum =
    maxHeight === undefined
      ? undefined
      : Math.max(0, maxHeight - verticalInset);
  return {
    inputStyle: {
      minHeight: minimum,
      maxHeight: maximum,
      height:
        measured?.key === key
          ? Math.min(maximum ?? Infinity, Math.max(minimum, measured.height))
          : undefined,
    },
    scrollEnabled: true,
    onLayout: enabled ? onLayout : undefined,
    measurement:
      enabled && width > 0
        ? { key, text: measuringText, width, onTextLayout }
        : undefined,
  };
}
