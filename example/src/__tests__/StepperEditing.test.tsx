import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';
import {
  Stepper,
  ThemeProvider,
  lightColors,
  r,
} from '@unif/react-native-design';
import type { StepperProps } from '@unif/react-native-design';

const Theme = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

function setup(props: Partial<StepperProps> = {}) {
  const onChange = jest.fn();
  const initial = {
    value: 4,
    onChange,
    accessibilityLabel: '整箱数量',
    editable: true,
    min: -10,
    max: 10,
    testID: 'quantity',
    formatValue: (value: number) => `${value} 箱`,
    ...props,
  };
  const page = render(<Stepper {...initial} />, { wrapper: Theme });
  const edit = () => {
    fireEvent.press(page.getByTestId('quantity-value'));
    return page.getByTestId('quantity-input');
  };
  return {
    ...page,
    onChange,
    edit,
    update: (next: Partial<StepperProps>) =>
      page.rerender(<Stepper {...initial} {...next} />),
  };
}

afterEach(() => jest.restoreAllMocks());

test('默认保持格式化 adjustable；editable 的 44pt 中央可编辑纯数字并只提交一次', () => {
  const page = setup({ editable: false, size: 'xs' });
  expect(page.getByRole('adjustable').props.accessibilityValue.now).toBe(4);
  expect(
    StyleSheet.flatten(page.getByTestId('quantity-decrement').props.style)
  ).toMatchObject({ width: r(24), height: 44, alignItems: 'flex-end' });
  expect(
    StyleSheet.flatten(page.getByTestId('quantity-increment').props.style)
  ).toMatchObject({ width: r(24), height: 44, alignItems: 'flex-start' });
  expect(
    StyleSheet.flatten(page.getByTestId('quantity-value').props.style)
  ).toMatchObject({ width: r(40), height: 44 });
  expect(page.getByTestId('quantity-decrement').props.hitSlop).toBeUndefined();
  expect(page.getByTestId('quantity-increment').props.hitSlop).toBeUndefined();
  expect(
    page.getByText('4 箱', { includeHiddenElements: true }).props
  ).toMatchObject({
    adjustsFontSizeToFit: true,
    minimumFontScale: 0.75,
    numberOfLines: 1,
  });
  expect(
    page.getByText('4 箱', { includeHiddenElements: true })
  ).toBeOnTheScreen();
  fireEvent.press(page.getByTestId('quantity-value'));
  expect(page.queryByTestId('quantity-input')).toBeNull();
  page.update({ size: 'xs', editable: true });
  const input = page.edit();
  expect(input.props.value).toBe('4');
  expect(input.props.accessibilityLabel).toBe('整箱数量');
  expect(StyleSheet.flatten(input.props.style)).toMatchObject({ height: 44 });
  fireEvent.changeText(input, '6');
  const submit = page.getByTestId('quantity-input').props.onSubmitEditing;
  const blur = page.getByTestId('quantity-input').props.onBlur;
  act(() => {
    submit();
    blur();
  });
  expect(page.onChange.mock.calls).toEqual([[6]]);
  expect(page.queryByTestId('quantity-input')).toBeNull();
  // 受控值尚未被宿主接纳，展示仍是 4 箱。
  expect(
    page.getByText('4 箱', { includeHiddenElements: true })
  ).toBeOnTheScreen();
});

test.each([
  ['0', 0],
  ['4', 4],
  [' -2.5 ', -2.5],
  ['.5', 0.5],
  ['+1.', 1],
  ['1e-2', 0.01],
  ['99', 10],
  ['-99', -10],
])(
  '完成输入 %s 按现有范围交付 %s，包括与当前值相同的显式输入',
  (text, expected) => {
    const page = setup({ step: 2 });
    const input = page.edit();
    fireEvent.changeText(input, text);
    fireEvent(page.getByTestId('quantity-input'), 'blur');
    expect(page.onChange.mock.calls).toEqual([[expected]]);
  }
);

test.each(['', ' ', '-', '.', '3箱', '0x10', 'Infinity', 'NaN', '1e999'])(
  '无效输入 %j 保留草稿和错误，不提交 0 或旧值',
  (text) => {
    const page = setup();
    const input = page.edit();
    fireEvent.changeText(input, text);
    fireEvent(page.getByTestId('quantity-input'), 'submitEditing');
    fireEvent(page.getByTestId('quantity-input'), 'blur');
    expect(page.onChange).not.toHaveBeenCalled();
    expect(page.getByTestId('quantity-input').props.value).toBe(text);
    expect(page.getByTestId('quantity-input').props.accessibilityHint).toBe(
      '请输入有效数字'
    );
    expect(
      StyleSheet.flatten(
        page.getByTestId('quantity-value-visual', {
          includeHiddenElements: true,
        }).props.style
      ).borderColor
    ).toBe(lightColors.error);
    fireEvent.changeText(page.getByTestId('quantity-input'), '2');
    expect(page.getByTestId('quantity-input').props.accessibilityHint).not.toBe(
      '请输入有效数字'
    );
    fireEvent(page.getByTestId('quantity-input'), 'submitEditing');
    expect(page.onChange.mock.calls).toEqual([[2]]);
  }
);

test.each(['increment', 'decrement'] as const)(
  '编辑后按 %s 使用草稿并合并 blur/press 为一次提交',
  (direction) => {
    const page = setup({ step: 2 });
    const input = page.edit();
    fireEvent.changeText(input, '7');
    const latestInput = page.getByTestId('quantity-input');
    const lateBlur = latestInput.props.onBlur;
    const button = page.getByTestId(`quantity-${direction}`);
    fireEvent(button, 'pressIn');
    fireEvent(latestInput, 'blur');
    expect(page.onChange).not.toHaveBeenCalled();
    fireEvent(button, 'pressOut');
    fireEvent.press(button);
    act(() => lateBlur());
    expect(page.onChange.mock.calls).toEqual([
      [direction === 'increment' ? 9 : 5],
    ]);
  }
);

test('草稿方向边界跟随输入，非法草稿不能通过加减悄悄提交旧值', () => {
  const page = setup({ value: 0, min: 0 });
  const input = page.edit();
  fireEvent.changeText(input, '7');
  expect(
    page.getByTestId('quantity-decrement').props.accessibilityState.disabled
  ).toBe(false);
  fireEvent.changeText(input, '');
  fireEvent.press(page.getByTestId('quantity-increment'));
  expect(page.onChange).not.toHaveBeenCalled();
  expect(page.getByTestId('quantity-input').props.value).toBe('');
  fireEvent.changeText(page.getByTestId('quantity-input'), '10');
  expect(
    page.getByTestId('quantity-increment').props.accessibilityState.disabled
  ).toBe(true);
  fireEvent.press(page.getByTestId('quantity-decrement'));
  expect(page.onChange.mock.calls).toEqual([[9]]);
});

test.each([
  { value: 8 },
  { disabled: true },
  { editable: false },
  { min: 4, max: 4 },
  { accessibilityLabel: ' ' },
  { max: 7 },
  { step: 2 },
])('外部状态 %j 使会话失效，迟到的输入、blur、submit 不回写', (next) => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const page = setup();
  const input = page.edit();
  fireEvent.changeText(input, '6');
  const oldInput = page.getByTestId('quantity-input').props;
  page.update(next);
  act(() => {
    oldInput.onChangeText('9');
    oldInput.onBlur();
    oldInput.onSubmitEditing();
  });
  expect(page.onChange).not.toHaveBeenCalled();
  expect(page.queryByTestId('quantity-input')).toBeNull();
  warn.mockRestore();
});

test('新会话和卸载不接纳旧输入回调', () => {
  const page = setup();
  const first = page.edit().props;
  act(() => first.onSubmitEditing());
  const second = page.edit().props;
  act(() => {
    first.onChangeText('9');
    first.onBlur();
  });
  expect(page.getByTestId('quantity-input').props.value).toBe('4');
  page.unmount();
  act(() => {
    second.onChangeText('8');
    second.onSubmitEditing();
  });
  expect(page.onChange.mock.calls).toEqual([[4]]);
});

test('Web 指针按加减保留输入焦点，文本输入不携带 slider 键盘 handler', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  const page = setup();
  const input = page.edit();
  expect(input.props.onKeyDown).toBeUndefined();
  const preventDefault = jest.fn();
  fireEvent(page.getByTestId('quantity-increment'), 'pointerDown', {
    preventDefault,
  });
  expect(preventDefault).toHaveBeenCalledTimes(1);
  fireEvent.changeText(input, '5');
  fireEvent.press(page.getByTestId('quantity-increment'));
  expect(page.onChange.mock.calls).toEqual([[6]]);
});

test('编辑状态只通知真实转换：非法失焦保持 true，合法相同值只结束一次', () => {
  const onEditingChange = jest.fn();
  const page = setup({ onEditingChange });
  expect(onEditingChange).not.toHaveBeenCalled();
  const input = page.edit();
  expect(onEditingChange.mock.calls).toEqual([[true]]);
  fireEvent.changeText(input, '');
  fireEvent(input, 'blur');
  expect(onEditingChange.mock.calls).toEqual([[true]]);
  fireEvent.changeText(input, '4');
  const events = page.getByTestId('quantity-input').props;
  act(() => {
    events.onSubmitEditing();
    events.onBlur();
  });
  expect(page.onChange.mock.calls).toEqual([[4]]);
  expect(onEditingChange.mock.calls).toEqual([[true], [false]]);
  page.unmount();
  expect(onEditingChange).toHaveBeenCalledTimes(2);
});

test.each([
  { value: 8 },
  { disabled: true },
  { editable: false },
  { min: 4, max: 4 },
  { accessibilityLabel: ' ' },
  { max: 7 },
  { step: 2 },
])('取消编辑 %j 只通知一次 false，不交付旧草稿', (next) => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const onEditingChange = jest.fn();
  const page = setup({ onEditingChange });
  const input = page.edit();
  fireEvent.changeText(input, '6');
  page.update(next);
  page.unmount();
  expect(page.onChange).not.toHaveBeenCalled();
  expect(onEditingChange.mock.calls).toEqual([[true], [false]]);
});

test('编辑状态回调身份变化不取消草稿；后续转换通知当前回调，卸载取消一次', () => {
  const first = jest.fn();
  const second = jest.fn();
  const page = setup({ onEditingChange: first });
  const input = page.edit();
  fireEvent.changeText(input, '6');
  page.update({ onEditingChange: second });
  expect(page.getByTestId('quantity-input').props.value).toBe('6');
  expect(first.mock.calls).toEqual([[true]]);
  expect(second).not.toHaveBeenCalled();
  page.unmount();
  expect(first.mock.calls).toEqual([[true]]);
  expect(second.mock.calls).toEqual([[false]]);
  expect(page.onChange).not.toHaveBeenCalled();
});

test('禁用的编辑入口拒绝打开会话，未编辑的 Web 加减不拦截指针默认行为', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  const onEditingChange = jest.fn();
  const page = setup({ disabled: true, onEditingChange });
  act(() =>
    page
      .UNSAFE_getAllByProps({ testID: 'quantity-value' })
      .find((node) => typeof node.props.onPress === 'function')!
      .props.onPress()
  );
  expect(page.queryByTestId('quantity-input')).toBeNull();
  expect(onEditingChange).not.toHaveBeenCalled();
  page.update({ disabled: false });
  const preventDefault = jest.fn();
  fireEvent(page.getByTestId('quantity-increment'), 'pointerDown', {
    preventDefault,
  });
  expect(preventDefault).not.toHaveBeenCalled();
  fireEvent.press(page.getByTestId('quantity-increment'));
  expect(page.onChange.mock.calls).toEqual([[5]]);
  expect(onEditingChange).not.toHaveBeenCalled();
});

test('同次中央重复激活只开启一个编辑会话', () => {
  const onEditingChange = jest.fn();
  const page = setup({ onEditingChange });
  const begin = page
    .UNSAFE_getAllByProps({ testID: 'quantity-value' })
    .find((node) => typeof node.props.onPress === 'function')!.props.onPress;
  act(() => {
    begin();
    begin();
  });
  expect(onEditingChange.mock.calls).toEqual([[true]]);
  expect(page.getByTestId('quantity-input').props.value).toBe('4');
});
