import { act, renderHook } from '@testing-library/react-native';
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

test('Web 无上限、未挂载、禁用与非法测量均保留有效布局，宽度事件触发重测', () => {
  const node = {
    scrollHeight: 90,
    scrollTop: 4,
    style: { height: '20px', minHeight: '0px' },
  };
  const options = {
    enabled: false,
    value: '',
    minHeight: 20,
    maxHeight: undefined,
    verticalInset: 20,
    fontSize: 14,
    placeholder: undefined,
    inputRef: { current: null as ComponentRef<typeof TextInput> | null },
  };
  const hook = renderHook(useMultilineLayout, { initialProps: options });
  expect(hook.result.current.inputStyle.height).toBe(0);
  hook.rerender({ ...options, enabled: true });
  expect(hook.result.current.inputStyle.height).toBe(0);
  const inputRef = {
    current: node as unknown as ComponentRef<typeof TextInput>,
  };
  hook.rerender({ ...options, enabled: true, inputRef });
  expect(hook.result.current.inputStyle.height).toBe(90);
  expect(hook.result.current.scrollEnabled).toBe(false);
  node.scrollHeight = Number.NaN;
  hook.rerender({ ...options, enabled: true, inputRef, value: 'changed' });
  expect(hook.result.current.inputStyle.height).toBe(90);
  node.scrollHeight = 45;
  act(() =>
    hook.result.current.onLayout?.({
      nativeEvent: { layout: { width: 150, height: 90, x: 0, y: 0 } },
    } as never)
  );
  expect(hook.result.current.inputStyle.height).toBe(45);
  expect(node.style).toEqual({ height: '20px', minHeight: '0px' });
  expect(node.scrollTop).toBe(4);
});
