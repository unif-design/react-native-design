import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RefreshOutlined } from '@unif/react-native-icons';
import { Empty, IconButton, ThemeProvider } from '@unif/react-native-design';

test('简单失败复用 Empty，提示不与重试合并，操作只由调用方触发', () => {
  const onRetry = jest.fn();
  const content = (loading = false) => (
    <ThemeProvider>
      <Empty
        title="暂时无法连接"
        icon={null}
        accessibilityRole="alert"
        action={
          <IconButton
            icon={RefreshOutlined}
            accessibilityLabel="重试"
            loading={loading}
            onPress={onRetry}
          />
        }
      />
    </ThemeProvider>
  );
  const page = render(content());
  expect(page.getByRole('alert')).toHaveTextContent('暂时无法连接');
  expect(page.queryByText('重试')).toBeNull();
  expect(onRetry).not.toHaveBeenCalled();
  fireEvent.press(page.getByRole('button', { name: '重试' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
  page.rerender(content(true));
  expect(page.getByRole('button', { name: '重试' })).toBeDisabled();
  fireEvent.press(page.getByRole('button', { name: '重试' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('普通空态仍默认展示图标，不自动增加操作或错误语义', () => {
  const page = render(
    <ThemeProvider>
      <Empty title="暂无客户" desc="可稍后查看" />
    </ThemeProvider>
  );
  expect(page.getByText('暂无客户')).toBeTruthy();
  expect(page.getByText('可稍后查看')).toBeTruthy();
  expect(page.queryByRole('alert')).toBeNull();
  expect(page.queryByRole('button')).toBeNull();
});
