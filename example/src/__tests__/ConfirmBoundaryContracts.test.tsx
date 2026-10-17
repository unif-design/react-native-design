import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Modal } from 'react-native';
import { confirm, ConfirmHost, ThemeProvider } from '@unif/react-native-design';
import * as runtime from '../../../src/components/ui/Confirm/confirm';
import type { ConfirmEvent } from '../../../src/components/ui/Confirm/store';

function findOutput(
  node: React.ReactNode,
  testID: string
):
  | React.ReactElement<{
      testID?: string;
      onPress: () => void;
      children?: React.ReactNode;
    }>
  | undefined {
  for (const child of React.Children.toArray(node)) {
    if (
      !React.isValidElement<{
        testID?: string;
        onPress: () => void;
        children?: React.ReactNode;
      }>(child)
    )
      continue;
    if (child.props.testID === testID) return child;
    const nested = findOutput(child.props.children, testID);
    if (nested) return nested;
  }
  return undefined;
}

afterEach(() => jest.restoreAllMocks());

test('标题型确认不需要 message，内部卡片阻止关闭，关闭后的原生残留事件不再结算', async () => {
  const page = render(
    <ThemeProvider>
      <ConfirmHost />
    </ThemeProvider>
  );
  act(() => page.UNSAFE_getByType(Modal).props.onRequestClose());
  let outcome!: Promise<boolean>;
  act(() => {
    outcome = confirm({ title: '只有标题' });
  });
  fireEvent.press(page.getByText('只有标题'));
  expect(page.getByTestId('confirm-ok')).toBeTruthy();
  fireEvent.press(page.getByTestId('confirm-ok'));
  await expect(outcome).resolves.toBe(true);
  const modal = page.UNSAFE_getByType(Modal);
  const staleSurface = findOutput(modal.props.children, 'confirm-ok');
  expect(staleSurface).toBeDefined();
  act(() => staleSurface!.props.onPress());
  act(() => modal.props.onRequestClose());
  expect(page.queryByTestId('confirm-ok')).toBeNull();
});

test('迟到的 clear 事件不能清掉新确认', async () => {
  const register = runtime.registerConfirmHost;
  let subscriber!: (event: ConfirmEvent) => void;
  jest.spyOn(runtime, 'registerConfirmHost').mockImplementation((handler) => {
    subscriber = handler;
    return register(handler);
  });
  const page = render(
    <ThemeProvider>
      <ConfirmHost />
    </ThemeProvider>
  );
  let first!: Promise<boolean>;
  act(() => {
    first = confirm({ title: '甲' });
  });
  fireEvent.press(page.getByTestId('confirm-cancel'));
  await expect(first).resolves.toBe(false);
  let second!: Promise<boolean>;
  act(() => {
    second = confirm({ title: '乙' });
  });
  act(() => subscriber({ type: 'clear', id: -1 }));
  expect(page.getByText('乙')).toBeTruthy();
  fireEvent.press(page.getByTestId('confirm-ok'));
  await expect(second).resolves.toBe(true);
});
