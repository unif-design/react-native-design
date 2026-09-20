import { renderHook } from '@testing-library/react-native';
import type { ComponentRef } from 'react';
import type { TextInput } from 'react-native';
import { useMultilineLayout } from '../../../src/components/ui/TextField/useMultilineLayout.web';

test('Web 多行测量按当前表面实际内边距限制增长、缩短并保留滚动位置', () => {
  const node = {
    scrollHeight: 84,
    scrollTop: 12,
    style: { height: '100px', minHeight: '24px' },
  };
  const inputRef = {
    current: node as unknown as ComponentRef<typeof TextInput>,
  };
  const options = {
    enabled: true,
    value: '四行文字',
    minHeight: 44,
    maxHeight: 120,
    verticalInset: 20,
    fontSize: 15,
    placeholder: undefined,
    inputRef,
  };
  const hook = renderHook(useMultilineLayout, { initialProps: options });
  expect(hook.result.current.inputStyle.height).toBe(84);
  expect(hook.result.current.scrollEnabled).toBe(false);
  expect(node.style).toEqual({ height: '100px', minHeight: '24px' });
  expect(node.scrollTop).toBe(12);
  node.scrollHeight = 300;
  hook.rerender({ ...options, value: '超过上限的长文' });
  expect(hook.result.current.inputStyle.height).toBe(100);
  expect(hook.result.current.scrollEnabled).toBe(true);
  node.scrollHeight = 18;
  hook.rerender({ ...options, value: '' });
  expect(hook.result.current.inputStyle.height).toBe(24);
  expect(hook.result.current.scrollEnabled).toBe(false);
  hook.rerender({ ...options, value: '', verticalInset: 22 });
  expect(hook.result.current.inputStyle.height).toBe(22);
});
