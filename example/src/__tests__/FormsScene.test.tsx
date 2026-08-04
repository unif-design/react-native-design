import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
  Form,
  FormGroup,
  FormRow,
  Input,
  PasswordInput,
  Search,
  Stepper,
  Textarea,
  type TextFieldHandle,
} from '@unif/react-native-design';
import App from '../App';
import {
  installReducedMotionMock,
  restoreNativeMocks,
} from './helpers/nativeMocks';
import { createShowcaseStateCoverage } from './helpers/showcaseStateCoverage';

jest.mock('react-native-safe-area-context', () => {
  const safeAreaMock = jest.requireActual(
    'react-native-safe-area-context/jest/mock'
  ).default;
  return {
    ...safeAreaMock,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('../../../node_modules/react-native-safe-area-context', () => {
  return jest.requireActual(
    '../../../node_modules/react-native-safe-area-context/jest/mock'
  ).default;
});

const mockTextFieldFocus = jest.fn();
const mockTextFieldBlur = jest.fn();

jest.mock('@unif/react-native-design', () => {
  const actual = jest.requireActual('@unif/react-native-design');
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const RefInput = ReactModule.forwardRef<
    TextFieldHandle,
    React.ComponentProps<typeof actual.Input>
  >(function RefInput(props, forwardedRef) {
    const actualRef = ReactModule.useRef<TextFieldHandle>(null);
    ReactModule.useImperativeHandle(
      forwardedRef,
      () =>
        props.testID === 'forms-ref-input'
          ? { focus: mockTextFieldFocus, blur: mockTextFieldBlur }
          : {
              focus: () => actualRef.current?.focus(),
              blur: () => actualRef.current?.blur(),
            },
      [props.testID]
    );
    return ReactModule.createElement(actual.Input, {
      ...props,
      ref: actualRef,
    });
  });
  return { ...actual, Input: RefInput };
});

function enterForms(): void {
  fireEvent.press(screen.getByRole('button', { name: /表单与输入/ }));
}

function componentByTestID<T extends React.ComponentType<never>>(
  component: T,
  testID: string
) {
  const found = screen
    .UNSAFE_getAllByType(component)
    .find((node) => node.props.testID === testID);
  if (!found) throw new Error(`未找到组件：${testID}`);
  return found;
}

beforeEach(() => {
  installReducedMotionMock(false);
  mockTextFieldFocus.mockClear();
  mockTextFieldBlur.mockClear();
});

afterEach(() => {
  restoreNativeMocks();
  jest.restoreAllMocks();
});

test('Input 与 Textarea 分别保持 controlled/uncontrolled mode，并覆盖主要视觉状态与 slot', () => {
  render(<App />);
  enterForms();
  const inputCoverage = createShowcaseStateCoverage('Input');
  const textareaCoverage = createShowcaseStateCoverage('Textarea');

  expect(screen.getByTestId('forms-screen')).toBeOnTheScreen();
  const controlledInput = componentByTestID(
    Input,
    'forms-input-controlled'
  ).props;
  expect(controlledInput).toMatchObject({
    value: '',
    leading: { kind: 'icon', icon: 'user' },
    trailing: {
      kind: 'action',
      icon: 'close',
      accessibilityLabel: '清除姓名',
    },
  });
  expect(controlledInput).not.toHaveProperty('defaultValue');
  inputCoverage.prove('input.controlled', 'input.action-slot', () => {
    expect(controlledInput).toMatchObject({
      value: '',
      trailing: { kind: 'action', accessibilityLabel: '清除姓名' },
    });
  });
  expect(componentByTestID(Input, 'forms-input-idle').props).toMatchObject({
    defaultValue: '',
    trailing: { kind: 'text', value: '选填' },
  });
  expect(componentByTestID(Input, 'forms-input-idle').props).not.toHaveProperty(
    'value'
  );
  inputCoverage.prove('input.uncontrolled', 'input.display-slots', () => {
    expect(componentByTestID(Input, 'forms-input-idle').props).toMatchObject({
      defaultValue: '',
      trailing: { kind: 'text', value: '选填' },
    });
  });
  const uncontrolledTextarea = componentByTestID(
    Textarea,
    'forms-textarea-uncontrolled'
  ).props;
  expect(uncontrolledTextarea).toMatchObject({
    defaultValue: '',
    leading: { kind: 'text', value: '备注' },
  });
  expect(uncontrolledTextarea).not.toHaveProperty('value');
  textareaCoverage.prove('textarea.uncontrolled', () => {
    expect(uncontrolledTextarea).toMatchObject({
      defaultValue: '',
      leading: { kind: 'text', value: '备注' },
    });
  });
  expect(
    componentByTestID(Textarea, 'forms-textarea-max-length').props
  ).toMatchObject({ value: '', maxLength: 40 });
  textareaCoverage.prove('textarea.controlled', 'textarea.max-length', () => {
    expect(
      componentByTestID(Textarea, 'forms-textarea-max-length').props
    ).toMatchObject({ value: '', maxLength: 40 });
  });

  const textareaInstance = componentByTestID(
    Textarea,
    'forms-textarea-uncontrolled'
  );
  fireEvent.changeText(
    screen.getByTestId('forms-input-controlled-input'),
    '王小明'
  );
  fireEvent.changeText(
    screen.getByTestId('forms-textarea-uncontrolled-input'),
    '拜访后回电'
  );
  expect(componentByTestID(Input, 'forms-input-controlled').props.value).toBe(
    '王小明'
  );
  expect(
    screen.getByTestId('forms-textarea-uncontrolled-input').props.value
  ).toBe('拜访后回电');
  expect(componentByTestID(Textarea, 'forms-textarea-uncontrolled')).toBe(
    textareaInstance
  );

  fireEvent.press(screen.getByRole('button', { name: '清除姓名' }));
  expect(componentByTestID(Input, 'forms-input-controlled').props.value).toBe(
    ''
  );

  expect(componentByTestID(Input, 'forms-input-idle').props.error).toBe(
    undefined
  );
  expect(componentByTestID(Input, 'forms-input-filled').props.value).toBe(
    '已填写'
  );
  expect(componentByTestID(Input, 'forms-input-error').props.error).toBe(
    '字段格式不正确'
  );
  inputCoverage.prove('input.error', () => {
    expect(componentByTestID(Input, 'forms-input-error').props.error).toBe(
      '字段格式不正确'
    );
  });
  expect(screen.getByText('字段格式不正确')).toBeOnTheScreen();
  expect(
    screen.getByTestId('forms-input-disabled-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
  inputCoverage.prove('input.disabled', () => {
    expect(
      screen.getByTestId('forms-input-disabled-input').props.accessibilityState
    ).toMatchObject({ disabled: true });
  });
  expect(
    screen.getByTestId('forms-input-readonly-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
  expect(
    screen.getByTestId('forms-textarea-readonly-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
  expect(componentByTestID(Textarea, 'forms-textarea-error').props.error).toBe(
    '备注需要补充'
  );
  textareaCoverage.prove('textarea.error', () => {
    expect(
      componentByTestID(Textarea, 'forms-textarea-error').props.error
    ).toBe('备注需要补充');
  });
  expect(
    screen.getByTestId('forms-textarea-disabled-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
  textareaCoverage.prove('textarea.disabled', () => {
    expect(
      screen.getByTestId('forms-textarea-disabled-input').props
        .accessibilityState
    ).toMatchObject({ disabled: true });
  });
  expect(
    componentByTestID(Textarea, 'forms-textarea-readonly').props.editable
  ).toBe(false);
  fireEvent.press(screen.getByRole('button', { name: '禁用输入操作' }));
  expect(
    screen.getByText('最新结果：Input · 清除 · 姓名草稿已清除')
  ).toBeOnTheScreen();
  inputCoverage.expectComplete();
  textareaCoverage.expectComplete();
});

test('Input 非受控实例只用 defaultValue 初始化，并在组件内部保持后续输入', () => {
  render(<App />);
  enterForms();

  const uncontrolledInput = componentByTestID(Input, 'forms-input-idle');
  expect(uncontrolledInput.props.defaultValue).toBe('');
  expect(uncontrolledInput.props).not.toHaveProperty('value');

  fireEvent.changeText(
    screen.getByTestId('forms-input-idle-input'),
    '非受控草稿'
  );
  expect(screen.getByTestId('forms-input-idle-input').props.value).toBe(
    '非受控草稿'
  );
  expect(componentByTestID(Input, 'forms-input-idle')).toBe(uncontrolledInput);
});

test('Input 尾侧 display slot 保持纯展示，并与清除 action slot 明确区分', () => {
  render(<App />);
  enterForms();

  expect(componentByTestID(Input, 'forms-input-idle').props.trailing).toEqual({
    kind: 'text',
    value: '选填',
  });
  expect(
    screen.getByText('选填', { includeHiddenElements: true })
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: '选填' })).not.toBeOnTheScreen();

  expect(
    componentByTestID(Input, 'forms-input-controlled').props.trailing
  ).toMatchObject({
    kind: 'action',
    accessibilityLabel: '清除姓名',
  });
  expect(screen.getByRole('button', { name: '清除姓名' })).toBeOnTheScreen();
});

test('Textarea 受控 maxLength specimen 驱动真实字数 counter', () => {
  render(<App />);
  enterForms();

  const controlledTextarea = componentByTestID(
    Textarea,
    'forms-textarea-max-length'
  );
  expect(controlledTextarea.props).toMatchObject({
    value: '',
    maxLength: 40,
  });
  expect(controlledTextarea.props).not.toHaveProperty('defaultValue');
  expect(controlledTextarea.props.onChangeText).toEqual(expect.any(Function));
  expect(screen.getByTestId('forms-textarea-counter')).toHaveTextContent(
    '字数：0/40'
  );

  fireEvent.changeText(
    screen.getByTestId('forms-textarea-max-length-input'),
    '跟进客户'
  );
  expect(
    componentByTestID(Textarea, 'forms-textarea-max-length').props.value
  ).toBe('跟进客户');
  expect(screen.getByTestId('forms-textarea-counter')).toHaveTextContent(
    '字数：4/40'
  );
});

test('Search 非受控 specimen 用 defaultValue 初始化并真实响应输入与清除', () => {
  render(<App />);
  enterForms();

  const uncontrolledSearch = componentByTestID(
    Search,
    'forms-search-uncontrolled'
  );
  expect(uncontrolledSearch.props.defaultValue).toBe('');
  expect(uncontrolledSearch.props).not.toHaveProperty('value');

  fireEvent.changeText(
    screen.getByTestId('forms-search-uncontrolled-input'),
    '按钮'
  );
  expect(
    screen.getByTestId('forms-search-uncontrolled-input').props.value
  ).toBe('按钮');
  fireEvent.press(screen.getByTestId('forms-search-uncontrolled-trailing'));
  expect(
    screen.getByTestId('forms-search-uncontrolled-input').props.value
  ).toBe('');
});

test('PasswordInput 显隐和 Search 清除/提交只记录长度，不泄露用户内容', () => {
  const password = '私密口令甲乙丙';
  const searchTerm = '不可记录的搜索词';
  const mounted = render(<App />);
  enterForms();
  const passwordCoverage = createShowcaseStateCoverage('PasswordInput');
  const searchCoverage = createShowcaseStateCoverage('Search');

  fireEvent.changeText(screen.getByTestId('forms-password-input'), password);
  expect(componentByTestID(PasswordInput, 'forms-password').props.value).toBe(
    password
  );
  passwordCoverage.prove('password-input.controlled', () => {
    expect(componentByTestID(PasswordInput, 'forms-password').props.value).toBe(
      password
    );
  });
  expect(screen.getByTestId('forms-password-input').props.secureTextEntry).toBe(
    true
  );
  passwordCoverage.prove('password-input.hidden', () => {
    expect(
      screen.getByTestId('forms-password-input').props.secureTextEntry
    ).toBe(true);
  });
  fireEvent.press(screen.getByTestId('forms-password-trailing'));
  expect(screen.getByTestId('forms-password-input').props.secureTextEntry).toBe(
    false
  );
  passwordCoverage.prove('password-input.visible', () => {
    expect(
      screen.getByTestId('forms-password-input').props.secureTextEntry
    ).toBe(false);
  });
  fireEvent.press(screen.getByRole('button', { name: '记录密码状态' }));
  expect(
    screen.getByText(
      `最新结果：PasswordInput · 检查 · 已输入 ${password.length} 个字符`
    )
  ).toBeOnTheScreen();
  passwordCoverage.prove('password-input.safe-result', () => {
    expect(
      screen.getByText(
        `最新结果：PasswordInput · 检查 · 已输入 ${password.length} 个字符`
      )
    ).toBeOnTheScreen();
  });
  for (const testID of [
    'forms-password-disabled-trailing',
    'forms-password-readonly-trailing',
  ]) {
    expect(screen.getByTestId(testID).props.accessibilityState).toMatchObject({
      disabled: true,
    });
    fireEvent.press(screen.getByTestId(testID));
  }
  expect(
    screen.getByTestId('forms-password-disabled-input').props.secureTextEntry
  ).toBe(true);
  expect(
    screen.getByTestId('forms-password-disabled-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
  passwordCoverage.prove('password-input.disabled', () => {
    expect(
      screen.getByTestId('forms-password-disabled-input').props
        .accessibilityState
    ).toMatchObject({ disabled: true });
  });
  expect(
    screen.getByTestId('forms-password-readonly-input').props.secureTextEntry
  ).toBe(true);
  expect(
    screen.getByTestId('forms-password-readonly-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
  expect(
    componentByTestID(PasswordInput, 'forms-password-error').props.error
  ).toBe('密码格式不正确');
  passwordCoverage.prove('password-input.error', () => {
    expect(
      componentByTestID(PasswordInput, 'forms-password-error').props.error
    ).toBe('密码格式不正确');
  });
  passwordCoverage.expectComplete();

  expect(componentByTestID(Search, 'forms-search').props).toMatchObject({
    value: '',
    onChangeText: expect.any(Function),
  });
  searchCoverage.prove('search.controlled', () => {
    expect(componentByTestID(Search, 'forms-search').props).toMatchObject({
      value: '',
      onChangeText: expect.any(Function),
    });
  });
  expect(
    componentByTestID(Search, 'forms-search-uncontrolled').props
  ).toMatchObject({ defaultValue: '' });
  expect(
    componentByTestID(Search, 'forms-search-uncontrolled').props
  ).not.toHaveProperty('value');
  searchCoverage.prove('search.uncontrolled', () => {
    expect(
      componentByTestID(Search, 'forms-search-uncontrolled').props
    ).toMatchObject({ defaultValue: '' });
  });

  fireEvent.changeText(screen.getByTestId('forms-search-input'), searchTerm);
  fireEvent(screen.getByTestId('forms-search-input'), 'submitEditing', {
    nativeEvent: { text: searchTerm },
  });
  expect(
    screen.getByText(
      `最新结果：Search · 提交 · 已提交 ${searchTerm.length} 个字符`
    )
  ).toBeOnTheScreen();
  searchCoverage.prove('search.submit', () => {
    expect(
      screen.getByText(
        `最新结果：Search · 提交 · 已提交 ${searchTerm.length} 个字符`
      )
    ).toBeOnTheScreen();
  });
  fireEvent.press(screen.getByRole('button', { name: '清除搜索内容' }));
  expect(componentByTestID(Search, 'forms-search').props.value).toBe('');
  searchCoverage.prove('search.clear', () => {
    expect(componentByTestID(Search, 'forms-search').props.value).toBe('');
  });
  expect(
    componentByTestID(Search, 'forms-search-disabled').props.disabled
  ).toBe(true);
  expect(
    screen.getByTestId('forms-search-disabled-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
  searchCoverage.prove('search.disabled', () => {
    expect(
      screen.getByTestId('forms-search-disabled-input').props.accessibilityState
    ).toMatchObject({ disabled: true });
  });
  expect(
    screen.queryByRole('button', { name: '清除搜索内容' })
  ).not.toBeOnTheScreen();

  const latestResultText = screen
    .getByTestId('result-latest')
    .findAllByType(Text)
    .flatMap((node) => node.props.children)
    .join('');
  const publicMetadata = mounted.UNSAFE_root.findAll(() => true)
    .flatMap((node) => [
      String(node.props.testID ?? ''),
      String(node.props.accessibilityLabel ?? ''),
    ])
    .join('|');
  const serialized = `${latestResultText}|${publicMetadata}`;
  expect(serialized).not.toContain(password);
  expect(serialized).not.toContain(searchTerm);
  expect(serialized).not.toContain('file:///');
  searchCoverage.expectComplete();
});

test('Checkbox、Radio 与 Switch 公开 checked/disabled 语义真实更新，禁用项不写结果', () => {
  render(<App />);
  enterForms();
  const checkboxCoverage = createShowcaseStateCoverage('Checkbox');
  const radioCoverage = createShowcaseStateCoverage('Radio');
  const switchCoverage = createShowcaseStateCoverage('Switch');

  const checkbox = screen.getByRole('checkbox', { name: '接收提醒' });
  expect(checkbox.props.accessibilityState).toMatchObject({
    checked: false,
    disabled: false,
  });
  checkboxCoverage.prove('checkbox.unchecked', 'checkbox.a11y-state', () => {
    expect(checkbox.props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
  });
  fireEvent.press(checkbox);
  expect(
    screen.getByRole('checkbox', { name: '接收提醒' }).props.accessibilityState
  ).toMatchObject({ checked: true });
  checkboxCoverage.prove('checkbox.checked', () => {
    expect(
      screen.getByRole('checkbox', { name: '接收提醒' }).props
        .accessibilityState
    ).toMatchObject({ checked: true });
  });
  expect(
    screen.getByText('最新结果：Checkbox · 切换 · 提醒已开启')
  ).toBeOnTheScreen();

  const disabledCheckbox = screen.getByRole('checkbox', {
    name: '禁用复选框',
  });
  expect(disabledCheckbox.props.accessibilityState).toMatchObject({
    disabled: true,
  });
  checkboxCoverage.prove('checkbox.disabled', () => {
    expect(disabledCheckbox.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
  fireEvent.press(disabledCheckbox);
  expect(
    screen.getByText('最新结果：Checkbox · 切换 · 提醒已开启')
  ).toBeOnTheScreen();
  checkboxCoverage.expectComplete();

  expect(screen.getByTestId('forms-radio-group').props).toMatchObject({
    accessibilityRole: 'radiogroup',
    accessibilityLabel: '联系偏好',
  });
  radioCoverage.prove('radio.group', () => {
    expect(screen.getByTestId('forms-radio-group').props).toMatchObject({
      accessibilityRole: 'radiogroup',
      accessibilityLabel: '联系偏好',
    });
  });
  expect(
    screen.getByRole('radio', { name: '电话' }).props.accessibilityState
  ).toMatchObject({ checked: true, disabled: false });
  radioCoverage.prove('radio.checked', () => {
    expect(
      screen.getByRole('radio', { name: '电话' }).props.accessibilityState
    ).toMatchObject({ checked: true, disabled: false });
  });
  expect(
    screen.getByRole('radio', { name: '短信' }).props.accessibilityState
  ).toMatchObject({ checked: false });
  radioCoverage.prove('radio.unchecked', () => {
    expect(
      screen.getByRole('radio', { name: '短信' }).props.accessibilityState
    ).toMatchObject({ checked: false });
  });
  fireEvent.press(screen.getByRole('radio', { name: '短信' }));
  expect(
    screen.getByRole('radio', { name: '短信' }).props.accessibilityState
  ).toMatchObject({ checked: true });
  const disabledRadio = screen.getByRole('radio', { name: '邮件' });
  expect(disabledRadio.props.accessibilityState).toMatchObject({
    disabled: true,
  });
  radioCoverage.prove('radio.disabled', () => {
    expect(disabledRadio.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
  fireEvent.press(disabledRadio);
  expect(
    screen.getByRole('radio', { name: '短信' }).props.accessibilityState
  ).toMatchObject({ checked: true });
  expect(
    screen.getByText('最新结果：Radio · 选择 · 已选择短信')
  ).toBeOnTheScreen();
  radioCoverage.expectComplete();

  const switchControl = screen.getByRole('switch', { name: '同步草稿' });
  expect(switchControl.props.accessibilityState).toMatchObject({
    checked: false,
    disabled: false,
  });
  switchCoverage.prove('switch.off', () => {
    expect(switchControl.props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
  });
  fireEvent.press(switchControl);
  expect(
    screen.getByRole('switch', { name: '同步草稿' }).props.accessibilityState
  ).toMatchObject({ checked: true, disabled: false });
  switchCoverage.prove('switch.on', () => {
    expect(
      screen.getByRole('switch', { name: '同步草稿' }).props.accessibilityState
    ).toMatchObject({ checked: true, disabled: false });
  });
  expect(
    screen.getByRole('switch', { name: '禁用开关' }).props.accessibilityState
  ).toMatchObject({ checked: true, disabled: true });
  switchCoverage.prove('switch.disabled', () => {
    expect(
      screen.getByRole('switch', { name: '禁用开关' }).props.accessibilityState
    ).toMatchObject({ checked: true, disabled: true });
  });
  fireEvent.press(screen.getByRole('switch', { name: '禁用开关' }));
  expect(
    screen.getByText('最新结果：Switch · 切换 · 草稿同步已开启')
  ).toBeOnTheScreen();
  switchCoverage.expectComplete();
});

test('Stepper 覆盖尺寸、步长、边界、零范围与禁用语义，只保留有效方向', () => {
  render(<App />);
  enterForms();
  const stateCoverage = createShowcaseStateCoverage('Stepper');

  expect(componentByTestID(Stepper, 'forms-stepper-main').props).toMatchObject({
    value: 0,
    min: 0,
    max: 10,
    step: 2,
    size: 'md',
  });
  stateCoverage.prove('stepper.min', () => {
    expect(
      componentByTestID(Stepper, 'forms-stepper-main').props
    ).toMatchObject({ value: 0, min: 0, max: 10, step: 2 });
  });
  expect(
    screen.getByRole('button', { name: '数量，减少' }).props.accessibilityState
  ).toMatchObject({ disabled: true });
  fireEvent.press(screen.getByRole('button', { name: '数量，增加' }));
  expect(
    screen.getByRole('adjustable', { name: '数量' }).props.accessibilityValue
  ).toMatchObject({ min: 0, max: 10, now: 2 });
  stateCoverage.prove('stepper.mid', () => {
    expect(
      screen.getByRole('adjustable', { name: '数量' }).props.accessibilityValue
    ).toMatchObject({ min: 0, max: 10, now: 2 });
  });
  const stepperResult = screen
    .getByTestId('result-latest')
    .findAllByType(Text)
    .flatMap((node) => node.props.children)
    .join('');

  expect(componentByTestID(Stepper, 'forms-stepper-small').props.size).toBe(
    'sm'
  );
  stateCoverage.prove('stepper.sizes', () => {
    expect(componentByTestID(Stepper, 'forms-stepper-small').props.size).toBe(
      'sm'
    );
  });
  expect(
    screen.getByRole('button', { name: '最大值，增加' }).props
      .accessibilityState
  ).toMatchObject({ disabled: true });
  stateCoverage.prove('stepper.max', () => {
    expect(
      screen.getByRole('button', { name: '最大值，增加' }).props
        .accessibilityState
    ).toMatchObject({ disabled: true });
  });
  expect(
    screen.getByRole('adjustable', { name: '零范围' }).props.accessibilityState
  ).toMatchObject({ disabled: true });
  expect(
    screen.getByRole('adjustable', { name: '禁用数量' }).props
      .accessibilityState
  ).toMatchObject({ disabled: true });
  stateCoverage.prove('stepper.disabled', () => {
    expect(
      screen.getByRole('adjustable', { name: '禁用数量' }).props
        .accessibilityState
    ).toMatchObject({ disabled: true });
  });
  fireEvent.press(screen.getByRole('button', { name: '禁用数量，增加' }));
  expect(
    screen.getByRole('adjustable', { name: '禁用数量' }).props
      .accessibilityValue
  ).toMatchObject({ now: 3 });
  expect(
    screen
      .getByTestId('result-latest')
      .findAllByType(Text)
      .flatMap((node) => node.props.children)
      .join('')
  ).toBe(stepperResult);
  stateCoverage.expectComplete();
});

test('Form/FormGroup/FormRow 真实组合 required 与单一 live error，child 保持显式名称', () => {
  render(<App />);
  enterForms();
  const formCoverage = createShowcaseStateCoverage('Form');
  const groupCoverage = createShowcaseStateCoverage('FormGroup');
  const rowCoverage = createShowcaseStateCoverage('FormRow');

  const multiGroupForm = componentByTestID(Form, 'forms-form');
  expect(multiGroupForm.findAllByType(FormGroup)).toHaveLength(2);
  expect(multiGroupForm.findAllByType(FormRow)).toHaveLength(3);
  formCoverage.prove('form.multi-group', () => {
    expect(multiGroupForm.findAllByType(FormGroup)).toHaveLength(2);
  });
  const singleGroupForm = componentByTestID(Form, 'forms-form-single');
  expect(singleGroupForm.findAllByType(FormGroup)).toHaveLength(1);
  expect(singleGroupForm.findAllByType(FormRow)).toHaveLength(1);
  formCoverage.prove('form.single-group', () => {
    expect(singleGroupForm.findAllByType(FormGroup)).toHaveLength(1);
  });
  formCoverage.expectComplete();

  expect(componentByTestID(FormGroup, 'forms-form-group').props.label).toBe(
    '客户资料'
  );
  groupCoverage.prove('form-group.labelled', () => {
    expect(componentByTestID(FormGroup, 'forms-form-group').props.label).toBe(
      '客户资料'
    );
  });
  expect(
    componentByTestID(FormGroup, 'forms-form-group-secondary').props.label
  ).toBeUndefined();
  groupCoverage.prove('form-group.unlabelled', () => {
    expect(
      componentByTestID(FormGroup, 'forms-form-group-secondary').props.label
    ).toBeUndefined();
  });
  groupCoverage.expectComplete();

  expect(componentByTestID(FormRow, 'forms-form-row-switch').props.label).toBe(
    '同步'
  );
  rowCoverage.prove('form-row.default', () => {
    expect(
      componentByTestID(FormRow, 'forms-form-row-switch').props.label
    ).toBe('同步');
  });
  expect(screen.getByText('客户名称 *')).toBeOnTheScreen();
  rowCoverage.prove('form-row.required', () => {
    expect(screen.getByText('客户名称 *')).toBeOnTheScreen();
  });
  expect(screen.getByLabelText('表单客户名称')).toBeOnTheScreen();
  const formError = screen.getByText('请输入客户名称');
  expect(formError.props.accessibilityLiveRegion).toBe('polite');
  rowCoverage.prove('form-row.error', () => {
    expect(formError.props.accessibilityLiveRegion).toBe('polite');
  });
  expect(screen.queryAllByText('请输入客户名称')).toHaveLength(1);
  expect(screen.getByLabelText('表单同步开关')).toBeOnTheScreen();
  expect(
    screen.getByRole('checkbox', { name: '资料已核对' })
  ).toBeOnTheScreen();
  rowCoverage.prove('form-row.a11y-control', () => {
    expect(screen.getByLabelText('表单同步开关')).toBeOnTheScreen();
  });
  rowCoverage.expectComplete();
});

test('Form 单组 specimen 只包含一个 FormGroup 与一个 FormRow', () => {
  render(<App />);
  enterForms();

  const singleGroupForm = componentByTestID(Form, 'forms-form-single');
  expect(singleGroupForm.findAllByType(FormGroup)).toHaveLength(1);
  expect(singleGroupForm.findAllByType(FormRow)).toHaveLength(1);
  expect(screen.getByText('单组示例')).toBeOnTheScreen();
  expect(screen.getByLabelText('单组备注')).toBeOnTheScreen();
});

test('TextField ref specimen 只通过 focus/blur 改变现场状态', () => {
  render(<App />);
  enterForms();

  const nativeInput = screen.getByTestId('forms-ref-input-input');
  expect(nativeInput.type).toBe('TextInput');
  fireEvent.press(screen.getByRole('button', { name: '聚焦演示输入' }));
  expect(mockTextFieldFocus).toHaveBeenCalledTimes(1);
  expect(mockTextFieldBlur).not.toHaveBeenCalled();
  expect(screen.getByText('引用状态：已聚焦')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '移开演示输入' }));
  expect(mockTextFieldBlur).toHaveBeenCalledTimes(1);
  expect(screen.getByText('引用状态：已失焦')).toBeOnTheScreen();
});

test('四个文本与受控状态跨路由保留，重置只恢复 Forms 且不清结果或 Navigation draft', () => {
  const inputValue = '姓名草稿';
  const passwordValue = '隐私草稿';
  const textareaValue = '备注草稿';
  const searchValue = '搜索草稿';
  render(<App />);
  enterForms();

  fireEvent.changeText(
    screen.getByTestId('forms-input-controlled-input'),
    inputValue
  );
  fireEvent.changeText(
    screen.getByTestId('forms-password-input'),
    passwordValue
  );
  fireEvent.changeText(
    screen.getByTestId('forms-textarea-uncontrolled-input'),
    textareaValue
  );
  fireEvent.changeText(screen.getByTestId('forms-search-input'), searchValue);
  fireEvent.press(screen.getByRole('checkbox', { name: '接收提醒' }));
  fireEvent.press(screen.getByRole('radio', { name: '短信' }));
  fireEvent.press(screen.getByRole('switch', { name: '同步草稿' }));
  fireEvent.press(screen.getByRole('button', { name: '数量，增加' }));
  fireEvent.press(screen.getByRole('button', { name: '记录密码状态' }));

  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  fireEvent.press(screen.getByRole('button', { name: /导航组件/ }));
  fireEvent.press(screen.getByRole('tab', { name: '详情' }));
  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  enterForms();

  expect(componentByTestID(Input, 'forms-input-controlled').props.value).toBe(
    inputValue
  );
  expect(componentByTestID(PasswordInput, 'forms-password').props.value).toBe(
    passwordValue
  );
  expect(
    screen.getByTestId('forms-textarea-uncontrolled-input').props.value
  ).toBe(textareaValue);
  expect(componentByTestID(Search, 'forms-search').props.value).toBe(
    searchValue
  );
  expect(
    screen.getByRole('checkbox', { name: '接收提醒' }).props.accessibilityState
  ).toMatchObject({ checked: true });
  expect(
    screen.getByRole('radio', { name: '短信' }).props.accessibilityState
  ).toMatchObject({ checked: true });
  expect(
    screen.getByRole('switch', { name: '同步草稿' }).props.accessibilityState
  ).toMatchObject({ checked: true });
  expect(
    screen.getByRole('adjustable', { name: '数量' }).props.accessibilityValue
  ).toMatchObject({ now: 2 });

  const resultBeforeReset = screen
    .getByTestId('result-latest')
    .findAllByType(Text)
    .flatMap((node) => node.props.children)
    .join('');
  fireEvent.press(screen.getByRole('button', { name: '重置本场景' }));
  expect(componentByTestID(Input, 'forms-input-controlled').props.value).toBe(
    ''
  );
  expect(componentByTestID(PasswordInput, 'forms-password').props.value).toBe(
    ''
  );
  expect(componentByTestID(Search, 'forms-search').props.value).toBe('');
  expect(
    screen.getByTestId('forms-textarea-uncontrolled-input').props.value
  ).toBe('');
  expect(
    screen.getByRole('checkbox', { name: '接收提醒' }).props.accessibilityState
  ).toMatchObject({ checked: false });
  expect(
    screen.getByRole('radio', { name: '电话' }).props.accessibilityState
  ).toMatchObject({ checked: true });
  expect(
    screen.getByRole('switch', { name: '同步草稿' }).props.accessibilityState
  ).toMatchObject({ checked: false });
  expect(
    screen.getByRole('adjustable', { name: '数量' }).props.accessibilityValue
  ).toMatchObject({ now: 0 });
  const resultAfterReset = screen
    .getByTestId('result-latest')
    .findAllByType(Text)
    .flatMap((node) => node.props.children)
    .join('');
  expect(resultAfterReset).toBe(resultBeforeReset);

  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  fireEvent.press(screen.getByRole('button', { name: /导航组件/ }));
  expect(
    screen.getByRole('tab', { name: '详情' }).props.accessibilityState
  ).toMatchObject({ selected: true });
});
