import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import {
  act,
  fireEvent,
  render,
  renderHook,
} from '@testing-library/react-native';
import { Input, Textarea, ThemeProvider } from '@unif/react-native-design';
import type {
  MultilineLayout,
  MultilineLayoutInput,
} from '../../../src/components/ui/TextField/types';

beforeEach(() => jest.replaceProperty(Platform, 'OS', 'ios'));
afterEach(() => jest.restoreAllMocks());

const layout = (width: number) => ({
  nativeEvent: { layout: { x: 0, y: 0, width, height: 17.6667 } },
});
const lines = (height: number) => ({
  nativeEvent: { lines: [{ y: 0, height }] },
});

function field(
  value: string,
  extra: Record<string, unknown> = {},
  fontScale = 1
) {
  return (
    <ThemeProvider fontScale={fontScale}>
      <Textarea
        testID="field"
        surface="plain"
        contentAlignment="center"
        value={value}
        onChangeText={jest.fn()}
        minHeight={44}
        maxHeight={120}
        accessibilityLabel="消息输入框"
        {...extra}
      />
    </ThemeProvider>
  );
}

test('iOS 按同宽原生文字行校正71pt内容，保留输入实例、原值与外部内容事件', () => {
  const changed = jest.fn();
  const edited = jest.fn();
  const selection = { start: 4, end: 4 };
  const page = render(
    field('完整语音长文', {
      onContentSizeChange: changed,
      onChangeText: edited,
      selection,
    })
  );
  const input = page.getByLabelText('消息输入框');
  fireEvent(input, 'layout', layout(286));
  const event = { nativeEvent: { contentSize: { width: 286, height: 71 } } };
  fireEvent(input, 'contentSizeChange', event);
  expect(changed).toHaveBeenCalledTimes(1);
  expect(changed).toHaveBeenCalledWith(event);
  const measurement = page.getByTestId('field-measurement', {
    includeHiddenElements: true,
  });
  expect(StyleSheet.flatten(measurement.props.style).width).toBe(286);
  expect(StyleSheet.flatten(measurement.props.style).fontSize).toBe(
    StyleSheet.flatten(input.props.style).fontSize
  );
  expect(measurement.props).toMatchObject({
    accessible: false,
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
    pointerEvents: 'none',
  });
  fireEvent(measurement, 'textLayout', {
    nativeEvent: {
      lines: [
        { y: 0, height: 17.75 },
        { y: 17.75, height: 17.75 },
        { y: 35.5, height: 17.75 },
        { y: 53.25, height: 17.75 },
      ],
    },
  });
  expect(StyleSheet.flatten(input.props.style).height).toBe(71);
  fireEvent(measurement, 'textLayout', lines(71));
  fireEvent(measurement, 'textLayout', lines(72));
  expect(StyleSheet.flatten(input.props.style).height).toBe(72);
  fireEvent(measurement, 'textLayout', lines(71));
  expect(changed).toHaveBeenCalledTimes(1);
  expect(page.getByLabelText('消息输入框')).toBe(input);
  expect(input.props.value).toBe('完整语音长文');
  expect(input.props.selection).toEqual(selection);
  expect(input.props.scrollEnabled).toBe(true);
  expect(edited).not.toHaveBeenCalled();
});

test('iOS 长短长与清空按独立行事件更新，不等待TextInput固定框的内容事件', () => {
  const page = render(field('长文'));
  const input = page.getByLabelText('消息输入框');
  const measure = () =>
    page.getByTestId('field-measurement', { includeHiddenElements: true });
  fireEvent(input, 'layout', layout(286));
  fireEvent(measure(), 'textLayout', lines(71));
  page.rerender(field('短文'));
  expect(StyleSheet.flatten(input.props.style).height).toBeUndefined();
  fireEvent(measure(), 'textLayout', lines(19));
  expect(StyleSheet.flatten(input.props.style).height).toBe(19);
  page.rerender(field('再次长文'));
  fireEvent(measure(), 'textLayout', lines(71));
  expect(StyleSheet.flatten(input.props.style).height).toBe(71);
  page.rerender(field(''));
  expect(measure().props.children).toBe('\u200B');
  fireEvent(measure(), 'textLayout', lines(17.6667));
  expect(StyleSheet.flatten(input.props.style).height).toBe(18);
  expect(input.props.value).toBe('');
});

test('iOS 拒绝旧文本、宽度和字体测量，保留实际缩放及换行策略', () => {
  const page = render(
    field('原文', {
      allowFontScaling: false,
      maxFontSizeMultiplier: 1.3,
      lineBreakStrategyIOS: 'standard',
    })
  );
  const input = page.getByLabelText('消息输入框');
  const measure = () =>
    page.getByTestId('field-measurement', { includeHiddenElements: true });
  fireEvent(input, 'layout', layout(200));
  const oldTextNode = measure();
  const oldText = oldTextNode.props.onTextLayout;
  page.rerender(
    field('新文', {
      allowFontScaling: false,
      maxFontSizeMultiplier: 1.3,
      lineBreakStrategyIOS: 'standard',
    })
  );
  expect(measure()).not.toBe(oldTextNode);
  expect(page.getByLabelText('消息输入框')).toBe(input);
  act(() => oldText(lines(300)));
  expect(StyleSheet.flatten(input.props.style).height).toBeUndefined();
  expect(measure().props).toMatchObject({
    allowFontScaling: false,
    maxFontSizeMultiplier: 1.3,
    lineBreakStrategyIOS: 'standard',
  });
  fireEvent(measure(), 'textLayout', lines(40));
  const oldWidthNode = measure();
  const oldWidth = oldWidthNode.props.onTextLayout;
  fireEvent(input, 'layout', layout(280));
  expect(measure()).not.toBe(oldWidthNode);
  act(() => oldWidth(lines(300)));
  expect(StyleSheet.flatten(input.props.style).height).toBeUndefined();
  fireEvent(measure(), 'textLayout', lines(30));
  const oldFontNode = measure();
  const oldFont = oldFontNode.props.onTextLayout;
  page.rerender(
    field(
      '新文',
      {
        allowFontScaling: true,
        maxFontSizeMultiplier: 1.5,
        lineBreakStrategyIOS: 'none',
      },
      2
    )
  );
  expect(measure()).not.toBe(oldFontNode);
  expect(page.getByLabelText('消息输入框')).toBe(input);
  act(() => oldFont(lines(300)));
  expect(StyleSheet.flatten(input.props.style).height).toBeUndefined();
  expect(StyleSheet.flatten(measure().props.style).fontSize).toBe(
    StyleSheet.flatten(input.props.style).fontSize
  );
  fireEvent(measure(), 'textLayout', lines(60));
  expect(StyleSheet.flatten(input.props.style).height).toBe(60);
});

test('iOS 空值及末尾换行实测空行，placeholder不写入原值，disabled仍更新几何', () => {
  const page = render(field('', { placeholder: '可见提示', disabled: true }));
  const input = page.getByLabelText('消息输入框');
  const measure = () =>
    page.getByTestId('field-measurement', { includeHiddenElements: true });
  fireEvent(input, 'layout', layout(200));
  expect(measure().props.children).toBe('可见提示');
  expect(input.props.editable).toBe(false);
  fireEvent(measure(), 'textLayout', lines(19));
  page.rerender(field('第一行\n', { disabled: true }));
  expect(measure().props.children).toBe('第一行\n\u200B');
  fireEvent(measure(), 'textLayout', lines(38));
  expect(StyleSheet.flatten(input.props.style).height).toBe(38);
  expect(input.props.value).toBe('第一行\n');
  page.rerender(field('第一行\n', { disabled: false }));
  expect(input.props.editable).toBe(true);
  expect(StyleSheet.flatten(input.props.style).height).toBe(38);
});

test('iOS 真实行高按最新min/max限位，非法或空行事件不覆盖有效结果', () => {
  const page = render(field('长文'));
  const input = page.getByLabelText('消息输入框');
  const measure = () =>
    page.getByTestId('field-measurement', { includeHiddenElements: true });
  fireEvent(input, 'layout', layout(200));
  fireEvent(measure(), 'textLayout', lines(500));
  expect(StyleSheet.flatten(input.props.style).height).toBe(
    StyleSheet.flatten(input.props.style).maxHeight
  );
  page.rerender(field('长文', { maxHeight: undefined }));
  expect(StyleSheet.flatten(input.props.style).height).toBe(500);
  for (const height of [NaN, -1, 0])
    fireEvent(measure(), 'textLayout', lines(height));
  fireEvent(measure(), 'textLayout', { nativeEvent: { lines: [] } });
  expect(StyleSheet.flatten(input.props.style).height).toBe(500);
  page.rerender(field('长文', { minHeight: 120, maxHeight: 120 }));
  expect(StyleSheet.flatten(input.props.style).height).toBe(
    StyleSheet.flatten(input.props.style).maxHeight
  );
  page.rerender(
    field('长文', { contentAlignment: 'start', minHeight: 120, maxHeight: 120 })
  );
  fireEvent(measure(), 'textLayout', lines(19));
  expect(StyleSheet.flatten(input.props.style).height).toBe(
    StyleSheet.flatten(input.props.style).minHeight
  );
});

test('iOS 无有效宽度不测量，单行输入不增加测量节点或内容订阅', () => {
  const nativeEvent = jest.fn();
  const page = render(
    <ThemeProvider>
      <Textarea
        testID="field"
        value="文字"
        onChangeText={jest.fn()}
        accessibilityLabel="备注"
      />
      <Input
        testID="single"
        accessibilityLabel="姓名"
        onContentSizeChange={nativeEvent}
      />
    </ThemeProvider>
  );
  const input = page.getByLabelText('备注');
  for (const width of [0, NaN, -1]) fireEvent(input, 'layout', layout(width));
  expect(
    page.queryByTestId('field-measurement', { includeHiddenElements: true })
  ).toBeNull();
  fireEvent(page.getByLabelText('姓名'), 'layout', layout(200));
  expect(
    page.queryByTestId('single-measurement', { includeHiddenElements: true })
  ).toBeNull();
  expect(page.getByLabelText('姓名').props.onContentSizeChange).toBe(
    nativeEvent
  );
});

test('Android 原生路径保留自然min/max，不增加文字测量或固定框高', () => {
  const native = jest.requireActual<{
    useMultilineLayout: (input: MultilineLayoutInput) => MultilineLayout;
  }>('../../../src/components/ui/TextField/useMultilineLayout.ts');
  const options: MultilineLayoutInput = {
    enabled: true,
    value: '原生长文',
    minHeight: 44,
    maxHeight: 120,
    verticalInset: 20,
    fontSize: 16,
    placeholder: undefined,
    inputRef: { current: null },
  };
  const hook = renderHook(native.useMultilineLayout, { initialProps: options });
  expect(hook.result.current.inputStyle).toEqual({
    minHeight: 24,
    maxHeight: 100,
  });
  expect(hook.result.current.measurement).toBeUndefined();
  expect(hook.result.current.scrollEnabled).toBe(true);
  hook.rerender({ ...options, maxHeight: undefined });
  expect(hook.result.current.inputStyle.maxHeight).toBeUndefined();
});
