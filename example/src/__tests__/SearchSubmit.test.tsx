import React, { useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Search, ThemeProvider } from '@unif/react-native-design';

test('搜索图标和键盘提交同一份当前值，输入和清除不触发提交', () => {
  const submit = jest.fn();
  const nativeSubmit = jest.fn();
  const page = render(
    <ThemeProvider>
      <Search
        defaultValue="茶"
        accessibilityLabel="商品关键词"
        onSubmit={submit}
        onSubmitEditing={nativeSubmit}
      />
    </ThemeProvider>
  );
  const input = page.getByLabelText('商品关键词');
  fireEvent.changeText(input, '红茶');
  expect(submit).not.toHaveBeenCalled();
  fireEvent.press(page.getByRole('button', { name: '搜索' }));
  expect(submit).toHaveBeenNthCalledWith(1, '红茶');
  expect(nativeSubmit).not.toHaveBeenCalled();
  fireEvent(input, 'submitEditing', { nativeEvent: { text: '过期原生值' } });
  expect(submit).toHaveBeenNthCalledWith(2, '红茶');
  expect(nativeSubmit).toHaveBeenCalledTimes(1);
  fireEvent.press(page.getByRole('button', { name: '清除搜索内容' }));
  expect(submit).toHaveBeenCalledTimes(2);
  fireEvent.press(page.getByRole('button', { name: '搜索' }));
  expect(submit).toHaveBeenNthCalledWith(3, '');
});

test('受控搜索图标读取宿主最新值', () => {
  const submit = jest.fn();
  function ControlledSearch() {
    const [value, setValue] = useState('茶');
    return (
      <Search
        value={value}
        onChangeText={setValue}
        onSubmit={submit}
        accessibilityLabel="商品关键词"
      />
    );
  }
  const page = render(
    <ThemeProvider>
      <ControlledSearch />
    </ThemeProvider>
  );
  fireEvent.changeText(page.getByLabelText('商品关键词'), '水');
  fireEvent.press(page.getByRole('button', { name: '搜索' }));
  expect(submit).toHaveBeenCalledWith('水');
});

test.each([{ disabled: true }, { editable: false }])(
  '不可编辑的搜索不提交：%j',
  (props) => {
    const submit = jest.fn();
    const nativeSubmit = jest.fn();
    const page = render(
      <ThemeProvider>
        <Search
          {...props}
          defaultValue="茶"
          accessibilityLabel="商品关键词"
          onSubmit={submit}
          onSubmitEditing={nativeSubmit}
        />
      </ThemeProvider>
    );
    const button = page.getByRole('button', { name: '搜索' });
    expect(button).toBeDisabled();
    fireEvent.press(button);
    fireEvent(page.getByLabelText('商品关键词'), 'submitEditing', {
      nativeEvent: { text: '茶' },
    });
    expect(submit).not.toHaveBeenCalled();
    expect(nativeSubmit).not.toHaveBeenCalled();
  }
);

test('没有提交处理器时搜索图标只作装饰', () => {
  const page = render(
    <ThemeProvider>
      <Search defaultValue="茶" />
    </ThemeProvider>
  );
  expect(page.queryByRole('button', { name: '搜索' })).toBeNull();
});
