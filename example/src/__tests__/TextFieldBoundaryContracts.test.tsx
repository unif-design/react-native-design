import React from 'react';
import {
  act,
  fireEvent,
  render,
  renderHook,
} from '@testing-library/react-native';
import { AccessibilityInfo, Platform, TextInput } from 'react-native';
import { SearchOutlined } from '@unif/react-native-icons';
import { Input, Search, ThemeProvider } from '@unif/react-native-design';
import { useTextFieldValue } from '../../../src/components/ui/TextField/useTextFieldValue';
import { useErrorAnnouncement } from '../../../src/components/ui/TextField/useErrorAnnouncement';
import { TextFieldSlot } from '../../../src/components/ui/TextField/TextFieldSlot';
import type { TextFieldHandle } from '../../../src/components/ui/TextField/types';

beforeEach(() => jest.clearAllMocks());
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('输入控制模式锁定并报告非法切换，缺回调的受控输入保持原值', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const change = jest.fn();
  const hook = renderHook(
    (props: Parameters<typeof useTextFieldValue>[0]) =>
      useTextFieldValue(props, 'Boundary'),
    { initialProps: { value: 'original', onChangeText: change } }
  );
  hook.rerender({ value: undefined, onChangeText: change });
  expect(hook.result.current.value).toBe('original');
  expect(warn).toHaveBeenCalledWith(
    '[TextField]',
    expect.stringContaining('value 变成了 undefined')
  );
  hook.rerender({ value: 1, onChangeText: change });
  expect(hook.result.current.value).toBe('original');
  expect(warn).toHaveBeenCalledWith(
    '[TextField]',
    expect.stringContaining('必须是字符串')
  );
  hook.rerender({ value: 'locked' });
  act(() => hook.result.current.onChangeText('ignored'));
  expect(hook.result.current.value).toBe('locked');
  expect(change).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledWith(
    '[TextField]',
    expect.stringContaining('缺少 onChangeText')
  );
  const uncontrolled = renderHook(
    (props: Parameters<typeof useTextFieldValue>[0]) =>
      useTextFieldValue(props, 'Uncontrolled'),
    { initialProps: { defaultValue: 'first' } }
  );
  uncontrolled.rerender({ value: 'external' });
  expect(uncontrolled.result.current.value).toBe('first');
  act(() => uncontrolled.result.current.onChangeText('typed'));
  expect(uncontrolled.result.current.value).toBe('typed');
  expect(warn).toHaveBeenCalledWith(
    '[TextField]',
    expect.stringContaining('后来收到了 value')
  );
});

test('非法布局和受管原生别名不会进入真实 TextInput，ref 与布局事件仍交付', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const ref = React.createRef<TextFieldHandle>();
  const layout = jest.fn();
  const page = render(
    <ThemeProvider>
      <Input
        ref={ref}
        height={Number.NaN}
        testID="input"
        onLayout={layout}
        {...({
          style: { color: 'red' },
          numberOfLines: 5,
        } as unknown as React.ComponentProps<typeof Input>)}
      />
    </ThemeProvider>
  );
  const input = page.UNSAFE_getByType(TextInput);
  const nativeRef = input.props.ref.current;
  const focus = jest.spyOn(nativeRef, 'focus');
  const blur = jest.spyOn(nativeRef, 'blur');
  act(() => {
    ref.current?.focus();
    ref.current?.blur();
  });
  expect(focus).toHaveBeenCalledTimes(1);
  expect(blur).toHaveBeenCalledTimes(1);
  const event = {
    nativeEvent: { layout: { width: 100, height: 44, x: 0, y: 0 } },
  };
  fireEvent(page.getByTestId('input-input'), 'layout', event);
  expect(layout).toHaveBeenCalledWith(event);
  expect(input.props.numberOfLines).toBeUndefined();
  expect(warn).toHaveBeenCalledWith(
    '[TextField]',
    expect.stringContaining('非法布局值')
  );
  expect(warn).toHaveBeenCalledWith(
    '[TextField]',
    expect.stringContaining('受管原生 props')
  );
});

test('非法 slot 与图标尺寸分别诊断，合法图标保留默认安全尺寸', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const page = render(
    <ThemeProvider>
      <TextFieldSlot
        slot={{ kind: 'icon', icon: SearchOutlined, size: -1 }}
        effectiveEditable
      />
    </ThemeProvider>
  );
  expect(page.UNSAFE_getByType(SearchOutlined).props.size).toBe(18);
  expect(warn).toHaveBeenCalledWith(
    '[TextFieldSlot]',
    expect.stringContaining('size 非法')
  );
  page.rerender(
    <ThemeProvider>
      <TextFieldSlot slot={{ kind: 'unknown' }} effectiveEditable />
    </ThemeProvider>
  );
  expect(page.queryByTestId('slot')).toBeNull();
  expect(warn).toHaveBeenCalledWith(
    '[TextFieldSlot]',
    expect.stringContaining('非法 TextField slot')
  );
});

test.each(['ios', 'android'] as const)(
  '%s 搜索的焦点、错误和后续错误播报保持平台语义',
  (os) => {
    jest.useFakeTimers();
    jest.replaceProperty(Platform, 'OS', os);
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const page = render(
      <ThemeProvider>
        <Search testID="search" />
      </ThemeProvider>
    );
    const input = page.getByTestId('search-input');
    fireEvent(input, 'focus', {});
    fireEvent(input, 'blur', {});
    page.rerender(
      <ThemeProvider>
        <Search testID="search" error="首次错误" />
      </ThemeProvider>
    );
    act(() => jest.runOnlyPendingTimers());
    if (os === 'ios') expect(announce).toHaveBeenLastCalledWith('首次错误');
    else expect(announce).not.toHaveBeenCalled();
    expect(page.getByTestId('search-error').props.accessibilityLiveRegion).toBe(
      os === 'android' ? 'polite' : undefined
    );
    page.rerender(
      <ThemeProvider>
        <Search testID="search" error="下一错误" />
      </ThemeProvider>
    );
    page.unmount();
    act(() => jest.runOnlyPendingTimers());
    expect(announce).not.toHaveBeenCalledWith('下一错误');
  }
);

test('错误清除不播报，已相同的值不重复触发', () => {
  jest.useFakeTimers();
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
  const hook = renderHook(useErrorAnnouncement, {
    initialProps: '已有错误' as string | undefined,
  });
  hook.rerender(undefined);
  act(() => jest.runOnlyPendingTimers());
  expect(announce).not.toHaveBeenCalled();
});

test('禁用期间交付的原生 submit 和焦点面事件不执行调用方行为', () => {
  const onSubmit = jest.fn();
  const page = render(
    <ThemeProvider>
      <Search disabled onSubmit={onSubmit} testID="disabled-search" />
    </ThemeProvider>
  );
  act(() =>
    page
      .UNSAFE_getByType(TextInput)
      .props.onSubmitEditing({ nativeEvent: { text: 'late' } })
  );
  expect(onSubmit).not.toHaveBeenCalled();
  const { Textarea } =
    require('@unif/react-native-design') as typeof import('@unif/react-native-design');
  page.rerender(
    <ThemeProvider>
      <Textarea disabled contentAlignment="center" testID="disabled-area" />
    </ThemeProvider>
  );
  const input = page.UNSAFE_getByType(TextInput);
  const focus = jest.spyOn(input.props.ref.current, 'focus');
  act(() =>
    page.UNSAFE_root.find(
      (node) =>
        node.props.testID === 'disabled-area-focus-surface' &&
        typeof node.props.onPress === 'function'
    ).props.onPress()
  );
  expect(focus).not.toHaveBeenCalled();
});
