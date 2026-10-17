import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SendOutlined } from '@unif/react-native-icons';
import { ActionMenuContent, ThemeProvider } from '@unif/react-native-design';

test.each(['dialog', 'sheet', 'popover'] as const)(
  '%s 菜单确认、取消、目标撤销与卡片点按保留调用方职责',
  (presentation) => {
    const events: string[] = [];
    const confirmation = {
      message: '这项内容将被删除',
      confirmLabel: '确认删除',
      title: '删除内容',
    };
    const remove = jest.fn(() => events.push('remove'));
    const save = jest.fn();
    const close = jest.fn(() => events.push('close'));
    const onConfirmationChange = jest.fn();
    const content = (withConfirmation: boolean) => (
      <ThemeProvider>
        <ActionMenuContent
          presentation={presentation}
          title="菜单"
          message="选择一项操作"
          pointer={{ edge: 'bottom', offset: 22 }}
          actions={[
            { id: 'save', label: '保存', onPress: save },
            {
              id: 'remove',
              label: '删除',
              onPress: remove,
              icon: SendOutlined,
              tone: 'danger',
              confirmation: withConfirmation ? confirmation : undefined,
            },
          ]}
          onClose={close}
          onConfirmationChange={onConfirmationChange}
          testID="menu"
        />
      </ThemeProvider>
    );
    const page = render(content(true));
    expect(page.getByText('选择一项操作')).toBeTruthy();
    expect(onConfirmationChange).toHaveBeenLastCalledWith(null);
    fireEvent.press(page.getByRole('button', { name: '保存' }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    fireEvent.press(page.getByRole('button', { name: '删除' }));
    expect(page.getByText('这项内容将被删除')).toBeTruthy();
    expect(page.getByText('删除内容')).toBeTruthy();
    expect(onConfirmationChange).toHaveBeenLastCalledWith('remove');
    fireEvent.press(page.getByRole('button', { name: '取消' }));
    expect(page.queryByText('这项内容将被删除')).toBeNull();
    expect(remove).not.toHaveBeenCalled();
    fireEvent.press(page.getByRole('button', { name: '删除' }));
    page.rerender(content(false));
    expect(page.queryByText('确认删除')).toBeNull();
    expect(onConfirmationChange).toHaveBeenLastCalledWith(null);
    page.rerender(content(true));
    fireEvent.press(page.getByRole('button', { name: '删除' }));
    fireEvent.press(page.getByRole('button', { name: '确认删除' }));
    expect(events).toEqual(['close', 'remove']);
    if (presentation !== 'popover') {
      const stopPropagation = jest.fn();
      fireEvent.press(page.getByTestId('menu-card'), { stopPropagation });
      expect(stopPropagation).toHaveBeenCalledTimes(1);
      expect(close).toHaveBeenCalledTimes(1);
      fireEvent.press(page.getByTestId('menu'));
      expect(close).toHaveBeenCalledTimes(2);
    }
  }
);

test.each(['dialog', 'sheet', 'popover'] as const)(
  '%s 隐藏取消按钮时保留默认标题与确认行为',
  (presentation) => {
    const close = jest.fn();
    const action = jest.fn();
    const page = render(
      <ThemeProvider>
        <ActionMenuContent
          presentation={presentation}
          cancelLabel={null}
          onClose={close}
          actions={[
            {
              id: 'run',
              label: '执行',
              onPress: action,
              confirmation: { message: '是否执行', confirmLabel: '确认执行' },
            },
          ]}
        />
      </ThemeProvider>
    );
    expect(page.queryByRole('button', { name: '取消' })).toBeNull();
    fireEvent.press(page.getByRole('button', { name: '执行' }));
    expect(page.queryByRole('button', { name: '取消' })).toBeNull();
    fireEvent.press(page.getByRole('button', { name: '确认执行' }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  }
);

test('没有名称的菜单项保留禁用语义，普通项通过真实按压执行', async () => {
  const { userEvent } =
    require('@testing-library/react-native') as typeof import('@testing-library/react-native');
  const {
    ActionMenuItem,
  } = require('../../../src/components/ui/ActionMenuContent/ActionMenuItem');
  const execute = jest.fn();
  const page = render(
    <ThemeProvider>
      <ActionMenuItem action={{ id: 'blank', label: ' ' }} onPress={execute} />
      <ActionMenuItem action={{ id: 'ok', label: '执行' }} onPress={execute} />
    </ThemeProvider>
  );
  expect(page.getAllByRole('button')).toHaveLength(1);
  await userEvent.press(page.getByRole('button', { name: '执行' }));
  expect(execute).toHaveBeenCalledTimes(1);
});

test('调用方动态撤回图标时菜单仍能交付动作', () => {
  const {
    ActionMenuItem,
  } = require('../../../src/components/ui/ActionMenuContent/ActionMenuItem');
  let reads = 0;
  const action = {
    id: 'changing-icon',
    label: '动态动作',
    get icon() {
      return reads++ === 0 ? SendOutlined : undefined;
    },
  };
  const execute = jest.fn();
  const page = render(
    <ThemeProvider>
      <ActionMenuItem action={action} onPress={execute} />
    </ThemeProvider>
  );
  fireEvent.press(page.getByRole('button', { name: '动态动作' }));
  expect(execute).toHaveBeenCalledTimes(1);
});
