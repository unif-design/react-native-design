import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Image, StyleSheet, Text, TextInput } from 'react-native';
import {
  Button,
  CircularProgress,
  Textarea,
  ThemeProvider,
  Thumbnail,
  type as typography,
} from '@unif/react-native-design';

describe('Design 独立消费契约', () => {
  test('空值也采用当前原生文字测量，保留大字号的输入行空间', () => {
    render(
      <ThemeProvider fontScale={2}>
        <Textarea
          value=""
          onChangeText={() => {}}
          minHeight={44}
          maxHeight={120}
          accessibilityLabel="大字号输入"
        />
      </ThemeProvider>
    );
    const input = screen.getByLabelText('大字号输入');
    fireEvent(input, 'contentSizeChange', {
      nativeEvent: { contentSize: { width: 200, height: 60 } },
    });
    expect(StyleSheet.flatten(input.props.style).height).toBe(60);
  });

  test('Textarea 交付原文，按内容尺寸增高、封顶、缩短及外部清空', () => {
    function Consumer() {
      const [value, setValue] = useState('');
      return (
        <>
          <Textarea
            value={value}
            onChangeText={setValue}
            minHeight={44}
            maxHeight={120}
            accessibilityLabel="消息输入框"
            submitBehavior="newline"
          />
          <Text>{`草稿：${value}`}</Text>
          <Button label="清空草稿" onPress={() => setValue('')} />
        </>
      );
    }
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );
    const input = screen.getByLabelText('消息输入框');
    fireEvent.changeText(input, ' 保留原文\n第二行 ');
    expect(screen.getByText('草稿： 保留原文\n第二行 ')).toBeTruthy();
    fireEvent(input, 'contentSizeChange', {
      nativeEvent: { contentSize: { width: 200, height: 80 } },
    });
    const grown = StyleSheet.flatten(input.props.style).height;
    expect(grown).toBe(80);
    fireEvent(input, 'contentSizeChange', {
      nativeEvent: { contentSize: { width: 200, height: 400 } },
    });
    expect(StyleSheet.flatten(input.props.style).height).toBeLessThan(120);
    expect(input.props.scrollEnabled).toBe(true);
    fireEvent(input, 'contentSizeChange', {
      nativeEvent: { contentSize: { width: 200, height: 25 } },
    });
    expect(StyleSheet.flatten(input.props.style).height).toBeLessThan(grown);
    expect(input.props.scrollEnabled).toBe(false);
    fireEvent(input, 'contentSizeChange', {
      nativeEvent: { contentSize: { width: 200, height: 400 } },
    });
    fireEvent.press(screen.getByRole('button', { name: '清空草稿' }));
    expect(input.props.value).toBe('');
    expect(input.props.scrollEnabled).toBe(false);
    expect(input.props.submitBehavior).toBe('newline');
  });

  test('Thumbnail 显式尺寸与失败占位不破坏图片实例隔离', () => {
    const view = render(
      <Thumbnail
        uri="https://example.test/a.png"
        size={{ width: 76, height: 51, borderRadius: 0 }}
        fallback={<Text>文件占位</Text>}
        selected
        testID="thumb"
      />
    );
    const frame = screen.getByTestId('thumb').children[0];
    expect(typeof frame).not.toBe('string');
    if (typeof frame === 'string' || !frame) throw new Error('缺少图像框');
    expect(StyleSheet.flatten(frame.props.style)).toMatchObject({
      width: 76,
      height: 51,
      borderRadius: 0,
      overflow: 'hidden',
    });
    expect(
      screen.queryByText('文件占位', { includeHiddenElements: true })
    ).toBeNull();
    const oldImage = screen.UNSAFE_getByType(Image);
    const oldOnError = oldImage.props.onError;
    fireEvent(oldImage, 'error');
    expect(
      screen.getByText('文件占位', { includeHiddenElements: true })
    ).toBeTruthy();
    view.rerender(
      <Thumbnail
        uri="https://example.test/a.png"
        size={{ width: 90, height: 60 }}
        fallback={<Text>新的占位</Text>}
      />
    );
    expect(
      screen.getByText('新的占位', { includeHiddenElements: true })
    ).toBeTruthy();
    expect(screen.UNSAFE_queryByType(Image)).toBeNull();
    view.rerender(
      <Thumbnail
        uri="https://example.test/b.png"
        fallback={<Text>新的占位</Text>}
      />
    );
    expect(
      screen.queryByText('新的占位', { includeHiddenElements: true })
    ).toBeNull();
    expect(screen.UNSAFE_getByType(Image).props.source).toEqual({
      uri: 'https://example.test/b.png',
    });
    act(() => oldOnError());
    expect(screen.UNSAFE_getByType(Image).props.source).toEqual({
      uri: 'https://example.test/b.png',
    });
  });

  test('Thumbnail 无有效 source 时显示有名称的占位，不挂载图片', () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(
        <ThemeProvider>
          <Thumbnail
            uri="   "
            fallback={<Text>文件占位</Text>}
            accessibilityLabel="附件占位"
          />
        </ThemeProvider>
      );
      expect(screen.getByRole('image', { name: '附件占位' })).toBeTruthy();
      expect(screen.getByText('文件占位')).toBeTruthy();
      expect(screen.UNSAFE_queryByType(Image)).toBeNull();
      expect(
        warning.mock.calls.some((call) => String(call[1]).includes('(source)'))
      ).toBe(true);
    } finally {
      warning.mockRestore();
    }
  });

  test('百分比使用真实 Provider 字号，文字不绑定圆环行高', () => {
    const view = render(
      <ThemeProvider fontScale={2}>
        <CircularProgress value={1} size={16} thickness={2} showLabel />
      </ThemeProvider>
    );
    const label = screen.getByText('100%', { includeHiddenElements: true });
    const labelStyle = StyleSheet.flatten(label.props.style);
    expect(labelStyle.fontSize).toBeCloseTo(typography.nano * 2);
    expect(labelStyle.height).toBeUndefined();
    expect(labelStyle.lineHeight).toBeUndefined();
    expect(labelStyle.position).not.toBe('absolute');
    expect(label.props.adjustsFontSizeToFit).not.toBe(true);
    expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(
      100
    );
    view.rerender(
      <ThemeProvider fontScale={2}>
        <CircularProgress value={0.42} size={16} />
      </ThemeProvider>
    );
    expect(
      screen.queryByText('42%', { includeHiddenElements: true })
    ).toBeNull();
  });

  test('Textarea 原生焦点事件与不可编辑状态保持公开交接', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const onChangeText = jest.fn();
    render(
      <Textarea
        value="草稿"
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled
        editable
      />
    );
    const input = screen.UNSAFE_getByType(TextInput);
    expect(input.props.editable).toBe(false);
    fireEvent(input, 'focus', { nativeEvent: {} });
    fireEvent(input, 'blur', { nativeEvent: {} });
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onChangeText).not.toHaveBeenCalled();
  });
});
