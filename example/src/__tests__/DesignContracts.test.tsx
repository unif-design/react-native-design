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
  test.each(['default', 'plain'] as const)(
    'Textarea %s 保留原生自然测量约束，内容尺寸事件原样交付',
    (surface) => {
      const onContentSizeChange = jest.fn();
      const view = render(
        <ThemeProvider fontScale={2}>
          <Textarea
            surface={surface}
            value=""
            onChangeText={() => {}}
            onContentSizeChange={onContentSizeChange}
            minHeight={44}
            maxHeight={120}
            accessibilityLabel="大字号输入"
          />
        </ThemeProvider>
      );
      const input = screen.getByLabelText('大字号输入');
      const style = StyleSheet.flatten(input.props.style);
      // 固定 height 会让 iOS Fabric 的布局尺寸不再变化，阻断后续内容尺寸通知。
      expect(style.height).toBeUndefined();
      expect(style.minHeight).toBeGreaterThan(0);
      expect(style.minHeight).toBeLessThan(44);
      expect(style.maxHeight - style.minHeight).toBe(120 - 44);
      expect(style.fontSize).toBe(typography.body * 2);
      const event = {
        nativeEvent: { contentSize: { width: 200, height: 60 } },
      };
      fireEvent(input, 'contentSizeChange', event);
      expect(onContentSizeChange).toHaveBeenCalledWith(event);
      expect(StyleSheet.flatten(input.props.style).height).toBeUndefined();

      view.rerender(
        <ThemeProvider fontScale={2}>
          <Textarea
            surface={surface}
            value="长文\n第二行\n第三行"
            onChangeText={() => {}}
            minHeight={44}
            maxHeight={44}
            accessibilityLabel="大字号输入"
          />
        </ThemeProvider>
      );
      // min=max 时也不能依赖框高变化才开启滚动；是否有溢出由原生输入处理。
      expect(input.props.scrollEnabled).toBe(true);
      const fixedStyle = StyleSheet.flatten(input.props.style);
      expect(fixedStyle.maxHeight).toBe(fixedStyle.minHeight);
    }
  );

  test.each(['default', 'plain'] as const)(
    'Textarea %s 原文、外部替换和清空保持同一输入实例及滚动能力',
    (surface) => {
      function Consumer() {
        const [value, setValue] = useState('');
        return (
          <>
            <Textarea
              surface={surface}
              value={value}
              onChangeText={setValue}
              minHeight={44}
              maxHeight={120}
              accessibilityLabel="消息输入框"
              submitBehavior="newline"
            />
            <Text>{`草稿：${value}`}</Text>
            <Button label="替换短文" onPress={() => setValue('短文')} />
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
      fireEvent.press(screen.getByRole('button', { name: '替换短文' }));
      expect(input.props.value).toBe('短文');
      expect(screen.getByLabelText('消息输入框')).toBe(input);
      fireEvent.press(screen.getByRole('button', { name: '清空草稿' }));
      expect(input.props.value).toBe('');
      expect(screen.getByLabelText('消息输入框')).toBe(input);
      expect(StyleSheet.flatten(input.props.style).height).toBeUndefined();
      expect(input.props.scrollEnabled).toBe(true);
      expect(input.props.submitBehavior).toBe('newline');
    }
  );

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

  test.each(['default', 'plain'] as const)(
    'Textarea %s 原生焦点事件与不可编辑状态保持公开交接',
    (surface) => {
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      const onChangeText = jest.fn();
      render(
        <Textarea
          surface={surface}
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
    }
  );

  test.each([undefined, 44])(
    'Textarea plain 在最小高度 %s 下保留触达和文字间距，焦点及错误不绘制独立表面',
    (minHeight) => {
      const props = {
        surface: 'plain' as const,
        value: '草稿',
        onChangeText: jest.fn(),
        minHeight,
        maxHeight: 120,
        testID: 'embedded-textarea',
        accessibilityLabel: '嵌入输入',
      };
      const view = render(
        <ThemeProvider>
          <Textarea {...props} />
        </ThemeProvider>
      );
      const input = screen.getByLabelText('嵌入输入');
      const root = screen.getByTestId('embedded-textarea');
      const frame = root.children[0];
      if (!frame || typeof frame === 'string')
        throw new Error('缺少输入交互区域');
      const frameStyle = () => StyleSheet.flatten(frame.props.style);
      const inputStyle = StyleSheet.flatten(input.props.style);
      const minimum = minHeight ?? 96;
      expect(StyleSheet.flatten(root.props.style).minHeight).toBe(minimum);
      expect(frameStyle()).toMatchObject({
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
      });
      expect(frameStyle().paddingHorizontal).toBeGreaterThan(0);
      expect(frameStyle().paddingVertical).toBeGreaterThan(0);
      expect(inputStyle.minHeight + frameStyle().paddingVertical * 2).toBe(
        minimum
      );
      expect(inputStyle.maxHeight + frameStyle().paddingVertical * 2).toBe(120);
      expect(input.props.underlineColorAndroid).toBe('transparent');
      fireEvent(input, 'focus', { nativeEvent: {} });
      expect(frameStyle()).toMatchObject({
        backgroundColor: 'transparent',
        borderWidth: 0,
      });
      view.rerender(
        <ThemeProvider>
          <Textarea {...props} error="请核对输入" disabled editable />
        </ThemeProvider>
      );
      expect(frameStyle()).toMatchObject({
        backgroundColor: 'transparent',
        borderWidth: 0,
      });
      expect(screen.getByText('请核对输入')).toBeTruthy();
      expect(input.props.editable).toBe(false);
      expect(input.props.accessibilityState.disabled).toBe(true);
      expect(input.props.value).toBe('草稿');
      expect(props.onChangeText).not.toHaveBeenCalled();
    }
  );
});
