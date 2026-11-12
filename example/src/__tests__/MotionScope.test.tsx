import React, { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { MotionScope, useMotionActive } from '@unif/react-native-design';

function Draft() {
  const active = useMotionActive();
  const [text, setText] = useState('原草稿');
  return (
    <>
      <Text>{active ? '播放' : '暂停'}</Text>
      <TextInput testID="draft" value={text} onChangeText={setText} />
    </>
  );
}

test('默认播放，嵌套范围取交集，暂停恢复保留内容实例与编辑值', () => {
  const defaults = render(<Draft />);
  expect(defaults.getByText('播放')).toBeOnTheScreen();
  defaults.unmount();
  const content = (parent: boolean, child: boolean) => (
    <MotionScope active={parent}>
      <MotionScope active={child}>
        <Draft />
      </MotionScope>
    </MotionScope>
  );
  const page = render(content(true, true));
  const input = page.getByTestId('draft');
  fireEvent.changeText(input, '保留编辑');
  page.rerender(content(false, true));
  expect(page.getByText('暂停')).toBeOnTheScreen();
  expect(page.getByTestId('draft')).toBe(input);
  expect(page.getByDisplayValue('保留编辑')).toBeOnTheScreen();
  page.rerender(content(true, false));
  expect(page.getByText('暂停')).toBeOnTheScreen();
  page.rerender(content(true, true));
  expect(page.getByText('播放')).toBeOnTheScreen();
  expect(page.getByTestId('draft')).toBe(input);
  expect(page.getByDisplayValue('保留编辑')).toBeOnTheScreen();
});
