import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
} from '@testing-library/react-native';
import { ThemeProvider, Segmented } from '@unif/react-native-design';
import {
  ShowcaseProvider,
  ShowcaseContext,
  type ShowcaseContextValue,
} from '../state/ShowcaseProvider';
import { useShowcase } from '../state/useShowcase';
import {
  createInitialShowcaseState,
  updateShowcaseScene,
  clearShowcaseResults,
} from '../state/showcaseState';
import { ResultPanel } from '../shared/ResultPanel';
import { FeedbackScene } from '../showcases/feedback/FeedbackScene';
import {
  registerConfirmHost,
  settleConfirm,
} from '../../../src/components/ui/Confirm/confirm';
import App from '../App';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);
jest.mock(
  '../../../node_modules/react-native-safe-area-context',
  () =>
    jest.requireActual(
      '../../../node_modules/react-native-safe-area-context/jest/mock'
    ).default
);

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('ShowcaseProvider 的 no-op 更新、重复导航、重置与短历史保持真实状态', () => {
  let context: ShowcaseContextValue;
  function Observe() {
    context = useShowcase();
    return <ResultPanel />;
  }
  const page = render(
    <ShowcaseProvider>
      <ThemeProvider>
        <Observe />
      </ThemeProvider>
    </ShowcaseProvider>
  );
  const initial = context!.state;
  act(() => context.clearResults());
  act(() => context.updateScene('forms', (state) => state));
  expect(context!.state).toBe(initial);
  act(() => context.navigate('forms'));
  const navigated = context!.state;
  act(() => context.navigate('forms'));
  expect(context!.state).toBe(navigated);
  act(() =>
    context.updateScene('forms', (state) => ({ ...state, inputValue: 'new' }))
  );
  act(() => context.resetScene('forms'));
  expect(context!.state.scenes.forms.inputValue).toBe('');
  act(() => {
    expect(context.back()).toBe(true);
    expect(context.back()).toBe(false);
  });
  for (const summary of ['first', 'second'])
    act(() =>
      context.appendResult({
        scene: 'forms',
        component: 'Input',
        action: '编辑',
        summary,
      })
    );
  fireEvent.press(page.getByRole('button', { name: '查看历史记录（1）' }));
  expect(page.getByText('Input · 编辑 · first')).toBeTruthy();
  expect(page.queryByText('仅展示最近 10 条记录')).toBeNull();
  fireEvent.press(page.getByRole('button', { name: '收起历史记录' }));
  fireEvent.press(page.getByRole('button', { name: '清空结果' }));
  expect(context!.state.results).toHaveLength(0);
  const state = createInitialShowcaseState();
  expect(clearShowcaseResults(state)).toBe(state);
  expect(updateShowcaseScene(state, 'media', (current) => current)).toBe(state);
});

test('缺少 ShowcaseProvider 时 Hook 给出明确错误', () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => renderHook(useShowcase)).toThrow(
    'useShowcase 必须在 ShowcaseProvider 内使用'
  );
});

test('反馈配置拒绝非法回调，连续确认取消按 Promise 实际结算', async () => {
  const page = render(<App />);
  fireEvent.press(page.getByRole('button', { name: /反馈与浮层/ }));
  for (const node of page.UNSAFE_getAllByType(Segmented))
    act(() => node.props.onChange('invalid'));
  fireEvent.press(page.getByTestId('feedback-confirm-reentrant'));
  await act(async () => {});
  fireEvent.press(page.getByRole('button', { name: '取消第一个请求' }));
  await act(async () => {});
  expect(
    page.getByText('最新结果：ConfirmHost · 重入结算 · 第一个请求已取消')
  ).toBeTruthy();
});

test('宿主同步结算时两次请求都可接受，示例保留异常重入诊断', async () => {
  const page = render(<App />);
  fireEvent.press(page.getByRole('button', { name: /反馈与浮层/ }));
  const lease = registerConfirmHost((event) => {
    if (event.type === 'show') settleConfirm(event.entry, true);
  });
  try {
    await act(async () =>
      fireEvent.press(page.getByTestId('feedback-confirm-reentrant'))
    );
    fireEvent.press(page.getByRole('button', { name: '查看历史记录（1）' }));
    expect(
      page.getByText('ConfirmHost · 重入保护 · 第二个请求异常返回 true')
    ).toBeTruthy();
    expect(
      page.getByText('最新结果：ConfirmHost · 重入结算 · 第一个请求已确认')
    ).toBeTruthy();
  } finally {
    act(() => lease.release(null));
  }
});

test('结果宿主抛错时三个异步入口都消费 rejection，不留下未处理任务', async () => {
  const fail = jest.fn(() => {
    throw new Error('result host unavailable');
  });
  function FailingResultBoundary() {
    const context = useShowcase();
    return (
      <ShowcaseContext.Provider value={{ ...context, appendResult: fail }}>
        <FeedbackScene />
      </ShowcaseContext.Provider>
    );
  }
  const page = render(
    <ShowcaseProvider>
      <ThemeProvider>
        <FailingResultBoundary />
      </ThemeProvider>
    </ShowcaseProvider>
  );
  const lease = registerConfirmHost((event) => {
    if (event.type === 'show') settleConfirm(event.entry, false);
  });
  try {
    for (const name of [
      '打开普通确认',
      '打开破坏性确认',
      '连续调用两次 Confirm',
    ])
      await act(async () =>
        fireEvent.press(page.getByRole('button', { name }))
      );
    expect(fail).toHaveBeenCalledTimes(3);
    expect(page.getByTestId('feedback-screen')).toBeTruthy();
  } finally {
    act(() => lease.release(null));
  }
});
