import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import {
  ActionMenuContent,
  Icon,
  IconButton,
  SmsField,
  TextEntryContent,
  ThemeProvider,
  type ActionMenuAction,
} from '@unif/react-native-design';

test('动作菜单独立消费：禁用、加载和确认返回当前动作', () => {
  const onPress = jest.fn();
  const onClose = jest.fn();
  const actions: ActionMenuAction[] = [
    { id: 'disabled', label: '不可使用', disabled: true, onPress },
    { id: 'loading', label: '正在处理', loading: true, onPress },
    {
      id: 'delete',
      label: '删除',
      onPress,
      confirmation: { message: '删除原项？', confirmLabel: '确认删除' },
    },
  ];
  const page = render(
    <ThemeProvider>
      <ActionMenuContent title="选择操作" actions={actions} onClose={onClose} />
    </ThemeProvider>
  );
  fireEvent.press(page.getByRole('button', { name: '不可使用' }), {
    stopPropagation: jest.fn(),
  });
  fireEvent.press(page.getByRole('button', { name: '正在处理' }), {
    stopPropagation: jest.fn(),
  });
  expect(onPress).not.toHaveBeenCalled();
  fireEvent.press(page.getByRole('button', { name: '删除' }));
  expect(page.getByText('删除原项？')).toBeTruthy();
  expect(onPress).not.toHaveBeenCalled();
  fireEvent.press(page.getByRole('button', { name: '取消' }));
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.press(page.getByRole('button', { name: '删除' }));
  fireEvent.press(page.getByRole('button', { name: '确认删除' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('确认中的动作被移除后不能调用旧操作', () => {
  const onPress = jest.fn();
  const onClose = jest.fn();
  const renderMenu = (actions: ActionMenuAction[]) => (
    <ThemeProvider>
      <ActionMenuContent actions={actions} onClose={onClose} />
    </ThemeProvider>
  );
  const page = render(
    renderMenu([
      {
        id: 'delete',
        label: '删除',
        onPress,
        confirmation: { message: '确认？', confirmLabel: '确定' },
      },
    ])
  );
  fireEvent.press(page.getByRole('button', { name: '删除' }));
  page.rerender(renderMenu([]));
  expect(page.queryByText('确认？')).toBeNull();
  expect(onPress).not.toHaveBeenCalled();
});

test('文字内容受控交接原文和外部更新，忙碌时禁止重复提交', () => {
  const onSubmit = jest.fn();
  const onCancel = jest.fn();
  const onChangeText = jest.fn();
  const content = (value: string, busy = false) => (
    <ThemeProvider fontScale={1.5}>
      <TextEntryContent
        title="编辑内容"
        value={value}
        onChangeText={onChangeText}
        onSubmit={onSubmit}
        onCancel={onCancel}
        busy={busy}
        message="保留空格与换行"
        maxLength={80}
      />
    </ThemeProvider>
  );
  const page = render(content('原文'));
  const input = page.getByLabelText('编辑内容');
  fireEvent.changeText(input, ' 新文\n第二行 ');
  expect(onChangeText).toHaveBeenCalledWith(' 新文\n第二行 ');
  expect(input.props.value).toBe('原文');
  page.rerender(content(' 新文\n第二行 '));
  fireEvent.press(page.getByRole('button', { name: '确认' }));
  expect(onSubmit).toHaveBeenCalledWith(' 新文\n第二行 ');
  page.rerender(content('新内容', true));
  expect(input.props.editable).toBe(false);
  fireEvent.press(page.getByRole('button', { name: '确认' }));
  expect(onSubmit).toHaveBeenCalledTimes(1);
});

test('SmsField 的文案、长度和冷却来自消费者，不创建计时器', () => {
  const onSend = jest.fn();
  function Consumer({ remainingSeconds = 0 }: { remainingSeconds?: number }) {
    const [value, setValue] = useState('');
    return (
      <ThemeProvider>
        <SmsField
          value={value}
          onChangeText={setValue}
          remainingSeconds={remainingSeconds}
          onSend={onSend}
          maxLength={4}
          placeholder="输入四位数字"
          sendLabel={remainingSeconds ? `等待 ${remainingSeconds}` : '发送短信'}
          sendAccessibilityLabel={
            remainingSeconds ? '请等待倒计时结束' : '发送短信'
          }
          accessibilityLabel="短信码"
        />
      </ThemeProvider>
    );
  }
  const page = render(<Consumer />);
  const input = page.getByLabelText('短信码');
  expect(input.props.maxLength).toBe(4);
  expect(input.props.placeholder).toBe('输入四位数字');
  fireEvent.changeText(input, '1234');
  expect(input.props.value).toBe('1234');
  fireEvent.press(page.getByRole('button', { name: '发送短信' }));
  expect(onSend).toHaveBeenCalledTimes(1);
  page.rerender(<Consumer remainingSeconds={9} />);
  fireEvent.press(page.getByRole('button', { name: '请等待倒计时结束' }));
  expect(onSend).toHaveBeenCalledTimes(1);
  expect(page.getByText('等待 9')).toBeTruthy();
});

test.each([21, 22])(
  'IconButton 独立图标 %s、36px 表面和44px命中区，loading 保留名称',
  (iconSize) => {
    const onPress = jest.fn();
    const content = (loading = false) => (
      <ThemeProvider>
        <IconButton
          icon="plus"
          size="md"
          surfaceSize={36}
          iconSize={iconSize}
          loading={loading}
          accessibilityLabel="地图操作"
          onPress={onPress}
        />
      </ThemeProvider>
    );
    const page = render(content());
    expect(page.UNSAFE_getByType(Icon).props.size).toBe(iconSize);
    const button = page.getByRole('button', { name: '地图操作' });
    const style = StyleSheet.flatten(button.props.style);
    expect(style.width).toBe(36);
    expect(style.height).toBe(36);
    expect(button.props.hitSlop).toEqual({
      top: 4,
      bottom: 4,
      left: 4,
      right: 4,
    });
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    page.rerender(content(true));
    expect(button.props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });
    expect(page.UNSAFE_getByType(ActivityIndicator).props.size).toBe(iconSize);
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  }
);
