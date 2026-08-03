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
  const uncontrolledTextarea = componentByTestID(
    Textarea,
    'forms-textarea-uncontrolled'
  ).props;
  expect(uncontrolledTextarea).toMatchObject({
    defaultValue: '',
    leading: { kind: 'text', value: '备注' },
  });
  expect(uncontrolledTextarea).not.toHaveProperty('value');

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
  expect(screen.getByText('字段格式不正确')).toBeOnTheScreen();
  expect(
    screen.getByTestId('forms-input-disabled-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
  expect(
    screen.getByTestId('forms-input-readonly-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
  expect(
    screen.getByTestId('forms-textarea-readonly-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
  expect(componentByTestID(Textarea, 'forms-textarea-error').props.error).toBe(
    '备注需要补充'
  );
  expect(
    screen.getByTestId('forms-textarea-disabled-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
  expect(
    componentByTestID(Textarea, 'forms-textarea-readonly').props.editable
  ).toBe(false);
  fireEvent.press(screen.getByRole('button', { name: '禁用输入操作' }));
  expect(
    screen.getByText('最新结果：Input · 清除 · 姓名草稿已清除')
  ).toBeOnTheScreen();
});

test('PasswordInput 显隐和 Search 清除/提交只记录长度，不泄露用户内容', () => {
  const password = '私密口令甲乙丙';
  const searchTerm = '不可记录的搜索词';
  const mounted = render(<App />);
  enterForms();

  fireEvent.changeText(screen.getByTestId('forms-password-input'), password);
  expect(componentByTestID(PasswordInput, 'forms-password').props.value).toBe(
    password
  );
  expect(screen.getByTestId('forms-password-input').props.secureTextEntry).toBe(
    true
  );
  fireEvent.press(screen.getByTestId('forms-password-trailing'));
  expect(screen.getByTestId('forms-password-input').props.secureTextEntry).toBe(
    false
  );
  fireEvent.press(screen.getByRole('button', { name: '记录密码状态' }));
  expect(
    screen.getByText(
      `最新结果：PasswordInput · 检查 · 已输入 ${password.length} 个字符`
    )
  ).toBeOnTheScreen();
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
  expect(
    screen.getByTestId('forms-password-readonly-input').props.secureTextEntry
  ).toBe(true);
  expect(
    screen.getByTestId('forms-password-readonly-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
  expect(
    componentByTestID(PasswordInput, 'forms-password-error').props.error
  ).toBe('密码格式不正确');

  fireEvent.changeText(screen.getByTestId('forms-search-input'), searchTerm);
  fireEvent(screen.getByTestId('forms-search-input'), 'submitEditing', {
    nativeEvent: { text: searchTerm },
  });
  expect(
    screen.getByText(
      `最新结果：Search · 提交 · 已提交 ${searchTerm.length} 个字符`
    )
  ).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '清除搜索内容' }));
  expect(componentByTestID(Search, 'forms-search').props.value).toBe('');
  expect(
    componentByTestID(Search, 'forms-search-disabled').props.disabled
  ).toBe(true);
  expect(
    screen.getByTestId('forms-search-disabled-input').props.accessibilityState
  ).toMatchObject({ disabled: true });
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
});

test('Checkbox、Radio 与 Switch 公开 checked/disabled 语义真实更新，禁用项不写结果', () => {
  render(<App />);
  enterForms();

  const checkbox = screen.getByRole('checkbox', { name: '接收提醒' });
  expect(checkbox.props.accessibilityState).toMatchObject({
    checked: false,
    disabled: false,
  });
  fireEvent.press(checkbox);
  expect(
    screen.getByRole('checkbox', { name: '接收提醒' }).props.accessibilityState
  ).toMatchObject({ checked: true });
  expect(
    screen.getByText('最新结果：Checkbox · 切换 · 提醒已开启')
  ).toBeOnTheScreen();

  const disabledCheckbox = screen.getByRole('checkbox', {
    name: '禁用复选框',
  });
  expect(disabledCheckbox.props.accessibilityState).toMatchObject({
    disabled: true,
  });
  fireEvent.press(disabledCheckbox);
  expect(
    screen.getByText('最新结果：Checkbox · 切换 · 提醒已开启')
  ).toBeOnTheScreen();

  expect(screen.getByTestId('forms-radio-group').props).toMatchObject({
    accessibilityRole: 'radiogroup',
    accessibilityLabel: '联系偏好',
  });
  expect(
    screen.getByRole('radio', { name: '电话' }).props.accessibilityState
  ).toMatchObject({ checked: true, disabled: false });
  fireEvent.press(screen.getByRole('radio', { name: '短信' }));
  expect(
    screen.getByRole('radio', { name: '短信' }).props.accessibilityState
  ).toMatchObject({ checked: true });
  const disabledRadio = screen.getByRole('radio', { name: '邮件' });
  expect(disabledRadio.props.accessibilityState).toMatchObject({
    disabled: true,
  });
  fireEvent.press(disabledRadio);
  expect(
    screen.getByRole('radio', { name: '短信' }).props.accessibilityState
  ).toMatchObject({ checked: true });
  expect(
    screen.getByText('最新结果：Radio · 选择 · 已选择短信')
  ).toBeOnTheScreen();

  const switchControl = screen.getByRole('switch', { name: '同步草稿' });
  fireEvent.press(switchControl);
  expect(
    screen.getByRole('switch', { name: '同步草稿' }).props.accessibilityState
  ).toMatchObject({ checked: true, disabled: false });
  expect(
    screen.getByRole('switch', { name: '禁用开关' }).props.accessibilityState
  ).toMatchObject({ checked: true, disabled: true });
  fireEvent.press(screen.getByRole('switch', { name: '禁用开关' }));
  expect(
    screen.getByText('最新结果：Switch · 切换 · 草稿同步已开启')
  ).toBeOnTheScreen();
});

test('Stepper 覆盖尺寸、步长、边界、零范围与禁用语义，只保留有效方向', () => {
  render(<App />);
  enterForms();

  expect(componentByTestID(Stepper, 'forms-stepper-main').props).toMatchObject({
    value: 0,
    min: 0,
    max: 10,
    step: 2,
    size: 'md',
  });
  expect(
    screen.getByRole('button', { name: '数量，减少' }).props.accessibilityState
  ).toMatchObject({ disabled: true });
  fireEvent.press(screen.getByRole('button', { name: '数量，增加' }));
  expect(
    screen.getByRole('adjustable', { name: '数量' }).props.accessibilityValue
  ).toMatchObject({ min: 0, max: 10, now: 2 });
  const stepperResult = screen
    .getByTestId('result-latest')
    .findAllByType(Text)
    .flatMap((node) => node.props.children)
    .join('');

  expect(componentByTestID(Stepper, 'forms-stepper-small').props.size).toBe(
    'sm'
  );
  expect(
    screen.getByRole('button', { name: '最大值，增加' }).props
      .accessibilityState
  ).toMatchObject({ disabled: true });
  expect(
    screen.getByRole('adjustable', { name: '零范围' }).props.accessibilityState
  ).toMatchObject({ disabled: true });
  expect(
    screen.getByRole('adjustable', { name: '禁用数量' }).props
      .accessibilityState
  ).toMatchObject({ disabled: true });
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
});

test('Form/FormGroup/FormRow 真实组合 required 与单一 live error，child 保持显式名称', () => {
  render(<App />);
  enterForms();

  expect(screen.UNSAFE_getAllByType(Form)).toHaveLength(1);
  expect(screen.UNSAFE_getAllByType(FormGroup)).toHaveLength(2);
  expect(screen.UNSAFE_getAllByType(FormRow)).toHaveLength(3);
  expect(screen.getByText('客户名称 *')).toBeOnTheScreen();
  expect(screen.getByLabelText('表单客户名称')).toBeOnTheScreen();
  const formError = screen.getByText('请输入客户名称');
  expect(formError.props.accessibilityLiveRegion).toBe('polite');
  expect(screen.queryAllByText('请输入客户名称')).toHaveLength(1);
  expect(screen.getByLabelText('表单同步开关')).toBeOnTheScreen();
  expect(
    screen.getByRole('checkbox', { name: '资料已核对' })
  ).toBeOnTheScreen();
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
