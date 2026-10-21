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

function controlledSetup(
  initialDraft: string | null,
  props: Partial<StepperProps> = {},
  strict = false
) {
  const onChange = jest.fn();
  const onDraftChange = jest.fn();
  const onEditingChange = jest.fn();
  let currentDraft = initialDraft;
  let replaceDraft!: (draft: string | null) => void;
  function Owner({
    shown = true,
    options = {},
  }: {
    shown?: boolean;
    options?: Partial<StepperProps>;
  }) {
    const [draft, setDraft] = React.useState(initialDraft);
    currentDraft = draft;
    replaceDraft = setDraft;
    return shown ? (
      <Stepper
        value={4}
        min={-10}
        max={10}
        onChange={onChange}
        accessibilityLabel="数量"
        editable
        testID="quantity"
        onEditingChange={onEditingChange}
        {...props}
        {...options}
        draft={draft}
        onDraftChange={(next) => {
          onDraftChange(next);
          setDraft(next);
        }}
      />
    ) : null;
  }
  const wrap = (shown: boolean, options: Partial<StepperProps> = {}) =>
    strict ? (
      <React.StrictMode>
        <Owner shown={shown} options={options} />
      </React.StrictMode>
    ) : (
      <Owner shown={shown} options={options} />
    );
  const page = render(wrap(true), { wrapper: Theme });
  return {
    ...page,
    onChange,
    onDraftChange,
    onEditingChange,
    readDraft: () => currentDraft,
    update: (options: Partial<StepperProps>) =>
      page.rerender(wrap(true, options)),
    show: (shown: boolean) => page.rerender(wrap(shown)),
    replaceDraft: (next: string | null) => act(() => replaceDraft(next)),
  };
}

test('受控草稿原样恢复，卸载不清外部原始字串，重新挂载后只提交一次', () => {
  const page = controlledSetup('-');
  expect(page.getByTestId('quantity-input').props.value).toBe('-');
  expect(page.onDraftChange).not.toHaveBeenCalled();
  expect(page.onChange).not.toHaveBeenCalled();
  expect(page.onEditingChange.mock.calls).toEqual([[true]]);
  fireEvent.changeText(page.getByTestId('quantity-input'), '01.');
  expect(page.readDraft()).toBe('01.');
  const stale = page.getByTestId('quantity-input').props;
  page.show(false);
  expect(page.readDraft()).toBe('01.');
  expect(page.onDraftChange.mock.calls).toEqual([['01.']]);
  act(() => {
    stale.onBlur();
    stale.onSubmitEditing();
  });
  expect(page.onChange).not.toHaveBeenCalled();
  page.show(true);
  expect(page.getByTestId('quantity-input').props.value).toBe('01.');
  const input = page.getByTestId('quantity-input').props;
  act(() => {
    input.onSubmitEditing();
    input.onBlur();
  });
  expect(page.onChange.mock.calls).toEqual([[1]]);
  expect(page.readDraft()).toBeNull();
  expect(page.onDraftChange.mock.calls).toEqual([['01.'], [null]]);
});

test('受控空闲入口交付初始字串，非法草稿保持原样，同值提交结束一次', () => {
  const page = controlledSetup(null);
  fireEvent.press(page.getByTestId('quantity-value'));
  expect(page.getByTestId('quantity-input').props.value).toBe('4');
  fireEvent.changeText(page.getByTestId('quantity-input'), '');
  fireEvent(page.getByTestId('quantity-input'), 'blur');
  expect(page.readDraft()).toBe('');
  expect(page.onChange).not.toHaveBeenCalled();
  fireEvent.changeText(page.getByTestId('quantity-input'), '4');
  const input = page.getByTestId('quantity-input').props;
  act(() => {
    input.onSubmitEditing();
    input.onBlur();
  });
  expect(page.onChange.mock.calls).toEqual([[4]]);
  expect(page.onDraftChange.mock.calls).toEqual([['4'], [''], ['4'], [null]]);
  expect(page.onEditingChange.mock.calls).toEqual([[true], [false]]);
});

test.each([
  { value: 8 },
  { min: 0 },
  { max: 7 },
  { step: 2 },
  { disabled: true },
  { editable: false },
])('外部状态 %j 取消受控草稿并拒绝迟到回调', (next) => {
  const page = controlledSetup('6');
  const old = page.getByTestId('quantity-input').props;
  page.update(next);
  expect(page.readDraft()).toBeNull();
  expect(page.queryByTestId('quantity-input')).toBeNull();
  act(() => {
    old.onChangeText('9');
    old.onBlur();
    old.onSubmitEditing();
  });
  expect(page.onChange).not.toHaveBeenCalled();
  expect(page.onDraftChange.mock.calls).toEqual([[null]]);
  expect(page.onEditingChange.mock.calls).toEqual([[true], [false]]);
});

test('外部替换受控草稿使旧输入失效，清空仅同步展示不回发草稿事件', () => {
  const page = controlledSetup('4');
  const old = page.getByTestId('quantity-input').props;
  page.replaceDraft('7');
  act(() => {
    old.onChangeText('9');
    old.onBlur();
  });
  expect(page.onChange).not.toHaveBeenCalled();
  expect(page.onDraftChange).not.toHaveBeenCalled();
  expect(page.getByTestId('quantity-input').props.value).toBe('7');
  page.replaceDraft(null);
  expect(page.queryByTestId('quantity-input')).toBeNull();
  expect(page.onDraftChange).not.toHaveBeenCalled();
  expect(page.onEditingChange.mock.calls).toEqual([[true], [false]]);
});

test('StrictMode 恢复草稿不发清空事件，重放effect后仍可正常编辑提交', () => {
  const page = controlledSetup('-', {}, true);
  expect(page.getByTestId('quantity-input').props.value).toBe('-');
  expect(page.readDraft()).toBe('-');
  expect(page.onDraftChange).not.toHaveBeenCalled();
  fireEvent.changeText(page.getByTestId('quantity-input'), '6');
  fireEvent(page.getByTestId('quantity-input'), 'submitEditing');
  expect(page.onChange.mock.calls).toEqual([[6]]);
  expect(page.readDraft()).toBeNull();
});

test('受控宿主未接纳输入时继续显示其原始草稿', () => {
  const onDraftChange = jest.fn();
  const page = setup({ draft: '4', onDraftChange });
  fireEvent.changeText(page.getByTestId('quantity-input'), '9');
  expect(onDraftChange.mock.calls).toEqual([['9']]);
  expect(page.getByTestId('quantity-input').props.value).toBe('4');
  expect(page.onChange).not.toHaveBeenCalled();
});

test('非受控仍支持只观察草稿事件，卸载不交付清空', () => {
  const onDraftChange = jest.fn();
  const page = setup({ onDraftChange });
  fireEvent.changeText(page.edit(), ' -2.5 ');
  expect(onDraftChange.mock.calls).toEqual([['4'], [' -2.5 ']]);
  page.unmount();
  expect(onDraftChange).toHaveBeenCalledTimes(2);
});

test('首次禁用保留受控恢复草稿，启用后才进入编辑且不自动提交', () => {
  const page = controlledSetup('07.', { disabled: true });
  expect(page.queryByTestId('quantity-input')).toBeNull();
  expect(page.readDraft()).toBe('07.');
  expect(page.onDraftChange).not.toHaveBeenCalled();
  expect(page.onEditingChange).not.toHaveBeenCalled();
  page.update({ disabled: false });
  expect(page.getByTestId('quantity-input').props.value).toBe('07.');
  expect(page.onDraftChange).not.toHaveBeenCalled();
  expect(page.onEditingChange.mock.calls).toEqual([[true]]);
  expect(page.onChange).not.toHaveBeenCalled();
});

test('受控提交先交付数字再请求清空，宿主拒绝结束后仍可改正而不会重复 blur 提交', () => {
  const events: string[] = [];
  let accepted = false;
  function Owner() {
    const [draft, setDraft] = React.useState<string | null>('1.5');
    return (
      <Stepper
        value={4}
        min={0}
        max={10}
        editable
        testID="quantity"
        accessibilityLabel="数量"
        draft={draft}
        onChange={(value) => {
          events.push(`value:${value}`);
          accepted = Number.isInteger(value);
        }}
        onDraftChange={(next) => {
          events.push(`draft:${next}`);
          if (next !== null || accepted) setDraft(next);
        }}
        onEditingChange={(editing) => events.push(`editing:${editing}`)}
      />
    );
  }
  const page = render(<Owner />, { wrapper: Theme });
  expect(events).toEqual(['editing:true']);
  events.length = 0;
  const first = page.getByTestId('quantity-input').props;
  act(() => {
    first.onSubmitEditing();
    first.onBlur();
  });
  expect(events).toEqual(['value:1.5', 'draft:null']);
  expect(page.getByTestId('quantity-input').props.value).toBe('1.5');
  fireEvent.changeText(page.getByTestId('quantity-input'), '2');
  expect(page.getByTestId('quantity-input').props.value).toBe('2');
  const next = page.getByTestId('quantity-input').props;
  act(() => {
    next.onSubmitEditing();
    next.onBlur();
  });
  expect(events).toEqual([
    'value:1.5',
    'draft:null',
    'draft:2',
    'value:2',
    'draft:null',
    'editing:false',
  ]);
  expect(page.queryByTestId('quantity-input')).toBeNull();
});

test('外部数值取消不等待草稿确认，旧输入和旧加减不能覆盖新数值', () => {
  const onDraftChange = jest.fn();
  const onEditingChange = jest.fn();
  const page = setup({ draft: '6', onDraftChange, onEditingChange });
  const oldInput = page.getByTestId('quantity-input').props;
  const oldIncrement = page
    .UNSAFE_getAllByProps({ testID: 'quantity-increment' })
    .find((node) => typeof node.props.onPress === 'function')!.props.onPress;
  page.update({ value: 8 });
  expect(page.queryByTestId('quantity-input')).toBeNull();
  expect(page.getByRole('adjustable').props.accessibilityValue.now).toBe(8);
  act(() => {
    oldInput.onChangeText('9');
    oldInput.onBlur();
    oldIncrement();
  });
  expect(page.onChange).not.toHaveBeenCalled();
  expect(onDraftChange.mock.calls).toEqual([[null]]);
  fireEvent.press(page.getByTestId('quantity-increment'));
  expect(page.onChange.mock.calls).toEqual([[9]]);
  expect(onDraftChange.mock.calls).toEqual([[null]]);
  expect(onEditingChange.mock.calls).toEqual([[true], [false]]);
});

test('父级接纳数字但延迟清空草稿时只请求一次结束，旧 blur 与加减失效', () => {
  const onDraftChange = jest.fn();
  const onChange = jest.fn();
  const onEditingChange = jest.fn();
  function Owner() {
    const [value, setValue] = React.useState(4);
    return (
      <Stepper
        value={value}
        min={0}
        max={10}
        editable
        testID="quantity"
        accessibilityLabel="数量"
        draft="6"
        onDraftChange={onDraftChange}
        onEditingChange={onEditingChange}
        onChange={(next) => {
          onChange(next);
          setValue(next);
        }}
      />
    );
  }
  const page = render(<Owner />, { wrapper: Theme });
  const old = page.getByTestId('quantity-input').props;
  const oldIncrement = page
    .UNSAFE_getAllByProps({ testID: 'quantity-increment' })
    .find((node) => typeof node.props.onPress === 'function')!.props.onPress;
  fireEvent(page.getByTestId('quantity-input'), 'submitEditing');
  expect(page.queryByTestId('quantity-input')).toBeNull();
  act(() => {
    old.onBlur();
    oldIncrement();
  });
  expect(onChange.mock.calls).toEqual([[6]]);
  expect(onDraftChange.mock.calls).toEqual([[null]]);
  expect(onEditingChange.mock.calls).toEqual([[true], [false]]);
});

test('观察非受控草稿时，外部取消交付一次 null', () => {
  const onDraftChange = jest.fn();
  const page = setup({ onDraftChange });
  page.edit();
  page.update({ value: 8 });
  expect(onDraftChange.mock.calls).toEqual([['4'], [null]]);
});

test.each([false, true])(
  '已取消的受控原稿不会在禁用切换时复活，明确重开使旧回调失效（曾提交 %s）',
  (submittedBeforeCancel) => {
    const onDraftChange = jest.fn();
    const onEditingChange = jest.fn();
    const page = setup({ draft: '6', onDraftChange, onEditingChange });
    const old = page.getByTestId('quantity-input').props;
    const oldIncrement = page
      .UNSAFE_getAllByProps({ testID: 'quantity-increment' })
      .find((node) => typeof node.props.onPress === 'function')!.props.onPress;
    if (submittedBeforeCancel) act(() => old.onSubmitEditing());
    const previousChanges = submittedBeforeCancel ? [[6]] : [];
    page.update({ value: 6 });
    page.update({ value: 6, disabled: true });
    page.update({ value: 6, disabled: false });
    expect(page.queryByTestId('quantity-input')).toBeNull();
    act(() => {
      old.onChangeText('9');
      old.onBlur();
      oldIncrement();
    });
    expect(page.onChange.mock.calls).toEqual(previousChanges);
    expect(onDraftChange.mock.calls).toEqual([[null]]);
    expect(onEditingChange.mock.calls).toEqual([[true], [false]]);
    fireEvent.press(page.getByTestId('quantity-value'));
    expect(page.getByTestId('quantity-input').props.value).toBe('6');
    expect(onDraftChange.mock.calls).toEqual([[null], ['6']]);
    expect(onEditingChange.mock.calls).toEqual([[true], [false], [true]]);
    act(() => {
      old.onChangeText('9');
      old.onBlur();
      oldIncrement();
    });
    expect(page.onChange.mock.calls).toEqual(previousChanges);
    expect(page.getByTestId('quantity-input').props.value).toBe('6');
    const current = page.getByTestId('quantity-input').props;
    act(() => {
      current.onSubmitEditing();
      current.onBlur();
    });
    expect(page.onChange.mock.calls).toEqual([...previousChanges, [6]]);
  }
);

test.each(['controlled', 'uncontrolled'] as const)(
  '%s 原输入回调在一次批次中 12→123→12 时仍交付最后原文',
  (mode) => {
    const observed = jest.fn();
    const page =
      mode === 'controlled'
        ? controlledSetup('12', { value: 12, max: 999 })
        : setup({ value: 12, max: 999, onDraftChange: observed });
    if (mode === 'uncontrolled')
      fireEvent.press(page.getByTestId('quantity-value'));
    const onDraftChange =
      'onDraftChange' in page ? page.onDraftChange : observed;
    onDraftChange.mockClear();
    const onChangeText = page.getByTestId('quantity-input').props.onChangeText;
    act(() => {
      onChangeText('123');
      onChangeText('12');
    });
    expect(onDraftChange.mock.calls).toEqual([['123'], ['12']]);
    expect(page.getByTestId('quantity-input').props.value).toBe('12');
    fireEvent(page.getByTestId('quantity-input'), 'submitEditing');
    expect(page.onChange.mock.calls).toEqual([[12]]);
  }
);
