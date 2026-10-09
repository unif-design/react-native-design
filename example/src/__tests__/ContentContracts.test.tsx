import React, { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActionMenuContent,
  Icon,
  IconButton,
  SmsField,
  TextEntryContent,
  ThemeProvider,
  fw,
  lightColors,
  darkColors,
  radius,
  r,
  space,
  type as typography,
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

test('compact文字编辑使用单行Input和紧凑tokens，取消先于确认，默认card保留多行与原按钮顺序', () => {
  const props = {
    title: '重命名会话',
    value: '原标题',
    onChangeText: jest.fn(),
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };
  const content = (variant?: 'card' | 'compact') => (
    <ThemeProvider>
      <TextEntryContent
        {...props}
        variant={variant}
        placeholder={variant ? '新标题(最多50字)' : undefined}
        testID="entry"
      />
    </ThemeProvider>
  );
  const page = render(content());
  expect(page.getByLabelText('重命名会话').props.multiline).toBe(true);
  expect(page.getByLabelText('重命名会话').props.autoFocus).toBe(true);
  expect(page.getByLabelText('重命名会话').props.placeholder).toBeUndefined();
  expect(
    page.getAllByRole('button').map((button) => button.props.accessibilityLabel)
  ).toEqual(['确认', '取消']);
  const card = StyleSheet.flatten(page.getByTestId('entry').props.style);
  expect(card).toMatchObject({
    padding: space[5],
    borderWidth: 1,
    gap: space[4],
  });
  page.rerender(content('compact'));
  expect(page.getByLabelText('重命名会话').props.multiline).toBe(false);
  expect(page.getByLabelText('重命名会话').props.autoFocus).toBe(true);
  expect(page.getByPlaceholderText('新标题(最多50字)')).toBeTruthy();
  expect(
    StyleSheet.flatten(page.getByTestId('entry').props.style)
  ).toMatchObject({
    padding: space[7],
    borderWidth: 0.5,
    borderRadius: radius['3xl'],
    gap: space[5],
  });
  expect(
    StyleSheet.flatten(page.getByText('重命名会话').props.style)
  ).toMatchObject({
    fontSize: typography.h2,
    fontWeight: fw.semi,
    textAlign: 'center',
  });
  expect(page.getByLabelText('重命名会话')).toHaveProp(
    'selectTextOnFocus',
    true
  );
  for (const label of ['取消', '确认']) {
    expect(page.getByRole('button', { name: label })).toHaveStyle({ flex: 1 });
  }
  expect(
    page.getAllByRole('button').map((button) => button.props.accessibilityLabel)
  ).toEqual(['取消', '确认']);
  page.rerender(content('card'));
  expect(page.getByLabelText('重命名会话').props.multiline).toBe(true);
  expect(page.getByPlaceholderText('新标题(最多50字)')).toBeTruthy();
});

test('compact保留受控原文、长度、自动聚焦、取消与busy语义', () => {
  const onChangeText = jest.fn(),
    onSubmit = jest.fn(),
    onCancel = jest.fn();
  const content = (busy = false, value = ' 原文\n第二行 ') => (
    <ThemeProvider fontScale={1.5}>
      <TextEntryContent
        variant="compact"
        title="编辑"
        value={value}
        onChangeText={onChangeText}
        onSubmit={onSubmit}
        onCancel={onCancel}
        maxLength={50}
        autoFocus={false}
        busy={busy}
      />
    </ThemeProvider>
  );
  const page = render(content());
  const input = page.getByLabelText('编辑');
  expect(input.props.maxLength).toBe(50);
  expect(input.props.autoFocus).toBe(false);
  fireEvent.changeText(input, ' 新内容 ');
  expect(onChangeText).toHaveBeenCalledWith(' 新内容 ');
  expect(input.props.value).toBe(' 原文\n第二行 ');
  fireEvent.press(page.getByRole('button', { name: '确认' }));
  expect(onSubmit).toHaveBeenCalledWith(' 原文\n第二行 ');
  fireEvent.press(page.getByRole('button', { name: '取消' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(StyleSheet.flatten(page.getByText('编辑').props.style).fontSize).toBe(
    typography.h2 * 1.5
  );
  page.rerender(content(true, ' 外部更新 '));
  expect(page.getByLabelText('编辑').props.editable).toBe(false);
  expect(page.getByLabelText('编辑').props.value).toBe(' 外部更新 ');
  fireEvent.press(page.getByRole('button', { name: '确认' }), {
    stopPropagation: jest.fn(),
  });
  fireEvent.press(page.getByRole('button', { name: '取消' }), {
    stopPropagation: jest.fn(),
  });
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onCancel).toHaveBeenCalledTimes(1);
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

test('popover只提供浮动菜单卡，文字与图标同排且禁用和忙碌动作不交付', () => {
  const choose = jest.fn();
  const close = jest.fn();
  const page = render(
    <ThemeProvider>
      <ActionMenuContent
        presentation="popover"
        onClose={close}
        actions={[
          { id: 'rename', label: '重命名', icon: 'edit', onPress: choose },
          {
            id: 'disabled',
            label: '不可使用',
            disabled: true,
            onPress: choose,
          },
          { id: 'busy', label: '处理中', loading: true, onPress: choose },
        ]}
      />
    </ThemeProvider>
  );
  expect(page.queryByRole('button', { name: '取消' })).toBeNull();
  expect(page.getByTestId('action-menu')).toHaveStyle({ width: r(240) });
  expect(page.getByRole('button', { name: '重命名' })).toHaveStyle({
    minHeight: 44,
  });
  fireEvent.press(page.getByRole('button', { name: '不可使用' }));
  fireEvent.press(page.getByRole('button', { name: '处理中' }));
  expect(choose).not.toHaveBeenCalled();
  fireEvent.press(page.getByRole('button', { name: '重命名' }));
  expect(choose).toHaveBeenCalledTimes(1);
  expect(close).not.toHaveBeenCalled();
});

test('popover删除先确认，取消返回原两项，不把旧确认应用到被移除的动作', () => {
  const remove = jest.fn();
  const close = jest.fn();
  const actions: ActionMenuAction[] = [
    { id: 'rename', label: '重命名', icon: 'edit', onPress: jest.fn() },
    {
      id: 'delete',
      label: '删除',
      icon: 'trash',
      tone: 'danger',
      onPress: remove,
      confirmation: { message: '删除后不可恢复', confirmLabel: '删除该会话' },
    },
  ];
  const content = (items: ActionMenuAction[]) => (
    <ThemeProvider>
      <ActionMenuContent
        presentation="popover"
        actions={items}
        onClose={close}
      />
    </ThemeProvider>
  );
  const page = render(content(actions));
  fireEvent.press(page.getByRole('button', { name: '删除' }));
  expect(remove).not.toHaveBeenCalled();
  expect(page.getByText('删除后不可恢复')).toBeTruthy();
  fireEvent.press(page.getByRole('button', { name: '取消' }));
  expect(page.queryByText('删除后不可恢复')).toBeNull();
  expect(page.getByRole('button', { name: '重命名' })).toBeTruthy();
  fireEvent.press(page.getByRole('button', { name: '删除' }));
  page.rerender(content([actions[0]!]));
  expect(page.queryByRole('button', { name: '删除该会话' })).toBeNull();
  expect(remove).not.toHaveBeenCalled();
  page.rerender(content(actions));
  fireEvent.press(page.getByRole('button', { name: '删除' }));
  fireEvent.press(page.getByRole('button', { name: '删除该会话' }));
  expect(close).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledTimes(1);
});

test('popover鼠标按下保留输入焦点且仅点击一次交付，禁用后不会继续拦截', () => {
  const original = Platform.OS;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  try {
    const choose = jest.fn();
    const content = (disabled = false) => (
      <ThemeProvider>
        <ActionMenuContent
          presentation="popover"
          onClose={jest.fn()}
          actions={[{ id: 'copy', label: '复制', disabled, onPress: choose }]}
        />
      </ThemeProvider>
    );
    const page = render(content());
    const preventDefault = jest.fn();
    fireEvent(page.getByRole('button', { name: '复制' }), 'pointerDown', {
      nativeEvent: { pointerType: 'mouse', button: 0 },
      preventDefault,
    });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(choose).not.toHaveBeenCalled();
    fireEvent.press(page.getByRole('button', { name: '复制' }));
    expect(choose).toHaveBeenCalledTimes(1);
    page.rerender(content(true));
    fireEvent(page.getByRole('button', { name: '复制' }), 'pointerDown', {
      nativeEvent: { pointerType: 'mouse', button: 0 },
      preventDefault,
    });
    fireEvent.press(page.getByRole('button', { name: '复制' }));
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(choose).toHaveBeenCalledTimes(1);
  } finally {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: original,
    });
  }
});

test('popover不读取安全区，不给输入框菜单新增SafeAreaProvider前置条件', () => {
  const read = jest.mocked(useSafeAreaInsets);
  const before = read.mock.calls.length;
  render(
    <ThemeProvider>
      <ActionMenuContent
        presentation="popover"
        onClose={jest.fn()}
        actions={[{ id: 'open', label: '打开', onPress: jest.fn() }]}
      />
    </ThemeProvider>
  );
  expect(read).toHaveBeenCalledTimes(before);
});

test('popover确认的取消和提交也保留原输入焦点且只交付一次', () => {
  const original = Platform.OS;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  try {
    const remove = jest.fn();
    const close = jest.fn();
    const preventDefault = jest.fn();
    const page = render(
      <ThemeProvider>
        <ActionMenuContent
          presentation="popover"
          onClose={close}
          actions={[
            {
              id: 'delete',
              label: '删除',
              onPress: remove,
              confirmation: { message: '删除原项？', confirmLabel: '确认删除' },
            },
          ]}
        />
      </ThemeProvider>
    );
    fireEvent.press(page.getByRole('button', { name: '删除' }));
    fireEvent(page.getByRole('button', { name: '取消' }), 'pointerDown', {
      nativeEvent: { pointerType: 'mouse', button: 0 },
      preventDefault,
      stopPropagation: jest.fn(),
    });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    fireEvent.press(page.getByRole('button', { name: '取消' }));
    expect(close).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    fireEvent.press(page.getByRole('button', { name: '删除' }));
    fireEvent(page.getByRole('button', { name: '确认删除' }), 'pointerDown', {
      nativeEvent: { pointerType: 'mouse', button: 0 },
      preventDefault,
      stopPropagation: jest.fn(),
    });
    expect(preventDefault).toHaveBeenCalledTimes(2);
    fireEvent.press(page.getByRole('button', { name: '确认删除' }));
    expect(close).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  } finally {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: original,
    });
  }
});

test('浮动确认允许宿主取消，标题与单独删除按钮保留当前动作和busy保护', () => {
  const remove = jest.fn(),
    close = jest.fn(),
    change = jest.fn();
  const action: ActionMenuAction = {
    id: 'remove',
    label: '删除',
    icon: 'trash',
    tone: 'danger',
    onPress: remove,
    confirmation: {
      title: '删除聊天',
      message: '此操作无法撤销。',
      confirmLabel: '删除',
    },
  };
  const content = (loading = false) => (
    <ThemeProvider>
      <ActionMenuContent
        presentation="popover"
        cancelLabel={null}
        actions={[{ ...action, loading }]}
        onClose={close}
        onConfirmationChange={change}
      />
    </ThemeProvider>
  );
  const page = render(content());
  fireEvent.press(page.getByRole('button', { name: '删除' }));
  expect(change).toHaveBeenLastCalledWith('remove');
  expect(page.getByRole('header', { name: '删除聊天' })).toBeTruthy();
  expect(page.getByText('此操作无法撤销。')).toBeTruthy();
  expect(page.getAllByRole('button')).toHaveLength(1);
  page.rerender(content(true));
  fireEvent.press(page.getByRole('button', { name: '删除' }));
  expect(remove).not.toHaveBeenCalled();
  page.rerender(content());
  fireEvent.press(page.getByRole('button', { name: '删除' }));
  expect(close).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledTimes(1);
});

test('浮动指针在卡片边缘内限位，方向可跟随宿主翻转且不进入读屏操作', () => {
  const content = (edge: 'top' | 'bottom', offset: number) => (
    <ThemeProvider>
      <ActionMenuContent
        presentation="popover"
        pointer={{ edge, offset }}
        actions={[{ id: 'rename', label: '重命名', onPress: jest.fn() }]}
        onClose={jest.fn()}
      />
    </ThemeProvider>
  );
  const page = render(content('top', -100));
  fireEvent(page.getByTestId('action-menu'), 'layout', {
    nativeEvent: { layout: { width: 240, height: 80 } },
  });
  expect(
    page.getByTestId('action-menu-pointer-top', { includeHiddenElements: true })
  ).toHaveStyle({ left: radius['3xl'] });
  page.rerender(content('bottom', 1000));
  expect(
    page.getByTestId('action-menu-pointer-bottom', {
      includeHiddenElements: true,
    })
  ).toHaveStyle({
    left: 240 - radius['3xl'] - r(26),
    transform: [{ rotate: '180deg' }],
  });
  expect(page.getAllByRole('button')).toHaveLength(1);
});

test('确认阶段仅随当前动作变化通知，宿主的内联回调重建不重复通知', () => {
  const changed = jest.fn();
  const action = {
    id: 'delete',
    label: '删除',
    onPress: jest.fn(),
    confirmation: { message: '确认？', confirmLabel: '确认删除' },
  };
  const content = (actions: ActionMenuAction[]) => (
    <ThemeProvider>
      <ActionMenuContent
        presentation="popover"
        actions={actions}
        onClose={jest.fn()}
        onConfirmationChange={(id) => changed(id)}
      />
    </ThemeProvider>
  );
  const page = render(content([action]));
  expect(changed.mock.calls).toEqual([[null]]);
  page.rerender(content([action]));
  expect(changed.mock.calls).toEqual([[null]]);
  fireEvent.press(page.getByRole('button', { name: '删除' }));
  page.rerender(content([action]));
  expect(changed.mock.calls).toEqual([[null], ['delete']]);
  page.rerender(content([]));
  expect(changed.mock.calls).toEqual([[null], ['delete'], [null]]);
});

test.each([40, 20])(
  '窄卡片实际宽%s时箭头居中且全部留在卡片横向范围内',
  (width) => {
    const page = render(
      <ThemeProvider>
        <ActionMenuContent
          presentation="popover"
          actions={[]}
          onClose={jest.fn()}
          pointer={{ edge: 'top', offset: 1000 }}
        />
      </ThemeProvider>
    );
    fireEvent(page.getByTestId('action-menu'), 'layout', {
      nativeEvent: { layout: { width, height: 80 } },
    });
    const arrow = page.getByTestId('action-menu-pointer-top', {
      includeHiddenElements: true,
    });
    const style = StyleSheet.flatten(arrow.props.style);
    expect(style.left).toBeGreaterThanOrEqual(0);
    expect(style.left + style.width).toBeLessThanOrEqual(width);
    expect(style.left + style.width / 2).toBe(width / 2);
  }
);

test.each(['light', 'dark'] as const)(
  'compact在%s主题保留品牌焦点和选区色',
  (scheme) => {
    const colors = scheme === 'dark' ? darkColors : lightColors;
    const page = render(
      <ThemeProvider forceScheme={scheme}>
        <TextEntryContent
          variant="compact"
          title="重命名聊天"
          value=""
          onChangeText={jest.fn()}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
          autoFocus={false}
        />
      </ThemeProvider>
    );
    const input = page.getByLabelText('重命名聊天');
    expect(input.props.selectionColor).toBe(colors.primary);
    fireEvent(input, 'focus');
    expect(
      page.UNSAFE_getAllByType(View).some((view) => {
        const style = StyleSheet.flatten(view.props.style);
        return (
          style?.borderRadius === radius.pill &&
          style.borderColor === colors.primary &&
          style.backgroundColor === colors.surface
        );
      })
    ).toBe(true);
    fireEvent(input, 'blur');
    expect(
      page.UNSAFE_getAllByType(View).some((view) => {
        const style = StyleSheet.flatten(view.props.style);
        return (
          style?.borderRadius === radius.pill &&
          style.borderColor === 'transparent' &&
          style.backgroundColor === colors.surfaceContainerHigh
        );
      })
    ).toBe(true);
  }
);

test.each(['light', 'dark'] as const)(
  '浮动确认在%s主题使用危险按钮配色且忙碌时不能提交',
  (scheme) => {
    const colors = scheme === 'dark' ? darkColors : lightColors;
    const remove = jest.fn();
    const content = (loading = false) => (
      <ThemeProvider forceScheme={scheme}>
        <ActionMenuContent
          presentation="popover"
          cancelLabel={null}
          onClose={jest.fn()}
          actions={[
            {
              id: 'delete',
              label: '删除',
              tone: 'danger',
              onPress: remove,
              loading,
              confirmation: {
                title: '删除聊天',
                message: '此操作无法撤销。',
                confirmLabel: '删除',
              },
            },
          ]}
        />
      </ThemeProvider>
    );
    const page = render(content());
    fireEvent.press(page.getByRole('button', { name: '删除' }));
    expect(page.getByRole('button', { name: '删除' })).toHaveStyle({
      backgroundColor: colors.error,
    });
    expect(page.getByText('删除')).toHaveStyle({ color: colors.onError });
    expect(page.getByRole('header', { name: '删除聊天' })).toHaveStyle({
      color: colors.foreground,
    });
    page.rerender(content(true));
    expect(page.UNSAFE_getByType(ActivityIndicator).props.color).toBe(
      colors.onError
    );
    fireEvent.press(page.getByRole('button', { name: '删除' }));
    expect(remove).not.toHaveBeenCalled();
  }
);
