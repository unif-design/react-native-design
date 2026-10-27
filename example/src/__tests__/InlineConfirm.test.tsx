import React, { useState } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { TrashOutlined } from '@unif/react-native-icons';
import type { ReactTestInstance } from 'react-test-renderer';
import {
  IconButton,
  InlineConfirmScope,
  ThemeProvider,
  lightColors,
  control,
  type as typography,
} from '@unif/react-native-design';

const reanimated = jest.requireMock<typeof import('react-native-reanimated')>(
  'react-native-reanimated'
);
const common = {
  icon: TrashOutlined,
  accessibilityLabel: '删除甲',
};
function pressHandler(node: ReactTestInstance): () => void {
  if (typeof node.props.onPress === 'function') return node.props.onPress;
  if (node.parent) return pressHandler(node.parent);
  throw new Error('缺少按钮点击处理器');
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('未传 confirmation 单击执行；传入后原位二击只交付一次，点外取消不交付', () => {
  const execute = jest.fn();
  const cancel = jest.fn();
  const view = (withConfirmation: boolean) => (
    <ThemeProvider>
      <InlineConfirmScope testID="scope">
        <IconButton
          {...common}
          onPress={execute}
          confirmation={
            withConfirmation
              ? { label: '确认删除', onCancel: cancel }
              : undefined
          }
        />
        <View testID="outside" />
      </InlineConfirmScope>
    </ThemeProvider>
  );
  const page = render(view(false));
  fireEvent.press(page.getByRole('button', { name: '删除甲' }));
  expect(execute).toHaveBeenCalledTimes(1);
  page.rerender(view(true));
  fireEvent.press(page.getByRole('button', { name: '删除甲' }));
  expect(execute).toHaveBeenCalledTimes(1);
  expect(page.getByRole('button', { name: '确认删除' })).toBeOnTheScreen();
  expect(page.queryByText('取消')).toBeNull();
  fireEvent(page.getByTestId('outside'), 'touchStart', {});
  expect(page.getByRole('button', { name: '确认删除' })).toBeOnTheScreen();
  fireEvent(page.getByTestId('outside'), 'touchEnd', {});
  act(() => jest.runOnlyPendingTimers());
  expect(page.queryByRole('button', { name: '确认删除' })).toBeNull();
  expect(cancel).toHaveBeenCalledTimes(1);
  fireEvent.press(page.getByRole('button', { name: '删除甲' }));
  const secondPress = pressHandler(
    page.getByRole('button', { name: '确认删除' })
  );
  act(() => {
    secondPress();
    secondPress();
  });
  expect(execute).toHaveBeenCalledTimes(2);
});

test('同一作用域只保留最近一次确认，其他控件首次点击照常交付', () => {
  const firstCancel = jest.fn();
  const secondExecute = jest.fn();
  const outside = jest.fn();
  const page = render(
    <ThemeProvider>
      <InlineConfirmScope testID="scope" onTouchStart={outside}>
        <IconButton
          {...common}
          onPress={() => {}}
          confirmation={{ label: '确认删除', onCancel: firstCancel }}
        />
        <IconButton
          {...common}
          accessibilityLabel="删除乙"
          onPress={secondExecute}
          confirmation={{ label: '确认删除' }}
        />
      </InlineConfirmScope>
    </ThemeProvider>
  );
  fireEvent.press(page.getByRole('button', { name: '删除甲' }));
  fireEvent.press(page.getByRole('button', { name: '删除乙' }));
  expect(page.getAllByRole('button', { name: '确认删除' })).toHaveLength(1);
  expect(page.getByRole('button', { name: '删除甲' })).toBeOnTheScreen();
  expect(firstCancel).toHaveBeenCalledTimes(1);
  fireEvent(page.getByTestId('scope'), 'touchStart', {});
  fireEvent(page.getByTestId('scope'), 'touchEnd', {});
  act(() => jest.runOnlyPendingTimers());
  expect(outside).toHaveBeenCalledTimes(1);
  expect(secondExecute).not.toHaveBeenCalled();
});

test.each(['touchCancel', 'pointerCancel'])(
  '点外手势被 %s 中断时完成取消，旧回调不能执行',
  (eventName) => {
    const cancel = jest.fn();
    const execute = jest.fn();
    const page = render(
      <ThemeProvider>
        <InlineConfirmScope testID="scope">
          <IconButton
            {...common}
            onPress={execute}
            confirmation={{ label: '确认删除', onCancel: cancel }}
          />
        </InlineConfirmScope>
      </ThemeProvider>
    );
    fireEvent.press(page.getByRole('button', { name: '删除甲' }));
    const stale = pressHandler(page.getByRole('button', { name: '确认删除' }));
    fireEvent(
      page.getByTestId('scope'),
      eventName === 'pointerCancel' ? 'pointerDown' : 'touchStart',
      {}
    );
    fireEvent(page.getByTestId('scope'), eventName, {});
    act(() => jest.runOnlyPendingTimers());
    act(() => stale());
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(execute).not.toHaveBeenCalled();
  }
);

test('点外释放后已切换到乙，旧手势的取消不再清掉乙', () => {
  const page = render(
    <ThemeProvider>
      <InlineConfirmScope testID="scope">
        {['甲', '乙'].map((id) => (
          <IconButton
            {...common}
            key={id}
            accessibilityLabel={`删除${id}`}
            onPress={() => {}}
            confirmation={{ label: '确认删除' }}
          />
        ))}
      </InlineConfirmScope>
    </ThemeProvider>
  );
  fireEvent.press(page.getByRole('button', { name: '删除甲' }));
  fireEvent(page.getByTestId('scope'), 'touchStart', {});
  fireEvent(page.getByTestId('scope'), 'touchEnd', {});
  fireEvent.press(page.getByRole('button', { name: '删除乙' }));
  act(() => jest.runOnlyPendingTimers());
  expect(page.getByRole('button', { name: '删除甲' })).toBeOnTheScreen();
  expect(page.getAllByRole('button', { name: '确认删除' })).toHaveLength(1);
});

test('同一按钮已进入新一轮受控确认，旧点外手势不能取消新一轮', () => {
  const cancel = jest.fn();
  const view = (confirming: boolean) => (
    <ThemeProvider>
      <InlineConfirmScope testID="scope">
        <IconButton
          {...common}
          onPress={() => {}}
          confirmation={{
            label: '确认删除',
            confirming,
            onRequest: () => {},
            onCancel: cancel,
          }}
        />
      </InlineConfirmScope>
    </ThemeProvider>
  );
  const page = render(view(true));
  fireEvent(page.getByTestId('scope'), 'touchStart', {});
  fireEvent(page.getByTestId('scope'), 'touchEnd', {});
  page.rerender(view(false));
  page.rerender(view(true));
  act(() => jest.runOnlyPendingTimers());
  expect(cancel).not.toHaveBeenCalled();
  expect(page.getByRole('button', { name: '确认删除' })).toBeOnTheScreen();
});

test('受控目标与版本继续归宿主，确认后旧 true 及旧回调不可重复交付', () => {
  const execute = jest.fn();
  const cancel = jest.fn();
  const request = jest.fn();
  const view = (confirming: boolean, key = '甲:1') => (
    <ThemeProvider>
      <InlineConfirmScope>
        <IconButton
          {...common}
          onPress={execute}
          confirmation={{
            label: '确认删除',
            confirming,
            confirmationKey: key,
            onRequest: request,
            onCancel: cancel,
          }}
        />
      </InlineConfirmScope>
    </ThemeProvider>
  );
  const page = render(view(false));
  fireEvent.press(page.getByRole('button', { name: '删除甲' }));
  expect(request).toHaveBeenCalledTimes(1);
  expect(page.queryByRole('button', { name: '确认删除' })).toBeNull();
  page.rerender(view(true));
  const stale = pressHandler(page.getByRole('button', { name: '确认删除' }));
  act(() => {
    stale();
    stale();
  });
  page.rerender(view(true));
  fireEvent.press(page.getByRole('button', { name: '删除甲' }));
  expect(execute).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledTimes(1);
  page.rerender(view(false));
  page.rerender(view(true));
  act(() => stale());
  expect(execute).toHaveBeenCalledTimes(1);
  expect(page.getByRole('button', { name: '确认删除' })).toBeOnTheScreen();
  page.rerender(view(true, '乙:1'));
  act(() => stale());
  expect(execute).toHaveBeenCalledTimes(1);
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(page.queryByRole('button', { name: '确认删除' })).toBeNull();
});

test.each(['disabled', 'loading'] as const)(
  '待确认期间 %s 会取消，恢复与卸载不复活旧回调',
  (state) => {
    const execute = jest.fn();
    const cancel = jest.fn();
    const view = (unavailable: boolean) => (
      <ThemeProvider>
        <InlineConfirmScope>
          <IconButton
            {...common}
            onPress={execute}
            confirmation={{ label: '确认删除', onCancel: cancel }}
            {...{ [state]: unavailable }}
          />
        </InlineConfirmScope>
      </ThemeProvider>
    );
    const page = render(view(false));
    fireEvent.press(page.getByRole('button', { name: '删除甲' }));
    const stale = pressHandler(page.getByRole('button', { name: '确认删除' }));
    page.rerender(view(true));
    act(() => stale());
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(execute).not.toHaveBeenCalled();
    if (state === 'loading')
      expect(page.getByRole('button', { name: '删除甲' })).toHaveStyle({
        width: control.md,
        height: control.md,
      });
    page.rerender(view(false));
    expect(page.queryByRole('button', { name: '确认删除' })).toBeNull();
    page.unmount();
    act(() => stale());
    expect(execute).not.toHaveBeenCalled();
  }
);

test('同一宿主确认对象从甲切到乙时，不用甲的取消回调清掉乙', () => {
  const execute = jest.fn();
  const cancel = jest.fn();
  function SharedTarget() {
    const [target, setTarget] = useState<string | null>(null);
    return (
      <InlineConfirmScope testID="scope">
        {['甲', '乙'].map((id) => (
          <IconButton
            {...common}
            key={id}
            accessibilityLabel={`删除${id}`}
            onPress={() => execute(id)}
            confirmation={{
              label: '确认删除',
              confirmationKey: id,
              confirming: target === id,
              onRequest: () => setTarget(id),
              onCancel: () => {
                cancel();
                setTarget(null);
              },
            }}
          />
        ))}
      </InlineConfirmScope>
    );
  }
  const page = render(
    <ThemeProvider>
      <SharedTarget />
    </ThemeProvider>
  );
  fireEvent.press(page.getByRole('button', { name: '删除甲' }));
  fireEvent.press(page.getByRole('button', { name: '删除乙' }));
  expect(cancel).not.toHaveBeenCalled();
  expect(page.getByRole('button', { name: '删除甲' })).toBeOnTheScreen();
  fireEvent(page.getByTestId('scope'), 'touchStart', {});
  fireEvent(page.getByTestId('scope'), 'touchEnd', {});
  act(() => jest.runOnlyPendingTimers());
  expect(cancel).toHaveBeenCalledTimes(1);
  fireEvent.press(page.getByRole('button', { name: '删除乙' }));
  fireEvent.press(page.getByRole('button', { name: '确认删除' }));
  expect(execute).toHaveBeenCalledWith('乙');
});

test('StrictMode 重放不会取消初始受控确认，卸载会使已捕获回调失活', () => {
  const execute = jest.fn();
  const cancel = jest.fn();
  const page = render(
    <React.StrictMode>
      <ThemeProvider>
        <InlineConfirmScope>
          <IconButton
            {...common}
            onPress={execute}
            confirmation={{
              label: '确认删除',
              confirming: true,
              confirmationKey: '甲:1',
              onRequest: jest.fn(),
              onCancel: cancel,
            }}
          />
        </InlineConfirmScope>
      </ThemeProvider>
    </React.StrictMode>
  );
  expect(cancel).not.toHaveBeenCalled();
  const confirm = pressHandler(page.getByRole('button', { name: '确认删除' }));
  page.unmount();
  act(() => confirm());
  expect(execute).not.toHaveBeenCalled();
  expect(cancel).not.toHaveBeenCalled();
});

test.each(['disabled', 'loading'] as const)(
  '初始受控确认处于 %s 时通知宿主取消一次，恢复后可重新请求',
  (state) => {
    const cancel = jest.fn();
    const request = jest.fn();
    const execute = jest.fn();
    function AlreadyRequested({ unavailable }: { unavailable: boolean }) {
      const [confirming, setConfirming] = useState(true);
      return (
        <IconButton
          {...common}
          onPress={() => {
            execute();
            setConfirming(false);
          }}
          confirmation={{
            label: '确认删除',
            confirmationKey: '甲:1',
            confirming,
            onRequest: () => {
              request();
              setConfirming(true);
            },
            onCancel: () => {
              cancel();
              setConfirming(false);
            },
          }}
          {...{ [state]: unavailable }}
        />
      );
    }
    const view = (unavailable: boolean) => (
      <React.StrictMode>
        <ThemeProvider>
          <InlineConfirmScope>
            <AlreadyRequested unavailable={unavailable} />
          </InlineConfirmScope>
        </ThemeProvider>
      </React.StrictMode>
    );
    const page = render(view(true));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(execute).not.toHaveBeenCalled();
    page.rerender(view(false));
    fireEvent.press(page.getByRole('button', { name: '删除甲' }));
    expect(request).toHaveBeenCalledTimes(1);
    fireEvent.press(page.getByRole('button', { name: '确认删除' }));
    expect(execute).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  }
);

test('宽度与交叉淡入淡出只在转场播放，动画结束前命中资格已同步切换', () => {
  jest.spyOn(reanimated, 'useReducedMotion').mockReturnValue(false);
  const stop = jest.fn();
  const timing = jest
    .spyOn(Animated, 'timing')
    .mockImplementation(() => ({ start: jest.fn(), stop, reset: jest.fn() }));
  const execute = jest.fn();
  const page = render(
    <ThemeProvider>
      <IconButton
        {...common}
        onPress={execute}
        confirmation={{ label: '确认删除' }}
      />
    </ThemeProvider>
  );
  expect(timing).not.toHaveBeenCalled();
  const measurement = page
    .UNSAFE_getAllByType(Text)
    .find((node) => typeof node.props.onLayout === 'function');
  if (!measurement) throw new Error('缺少确认文字测量');
  fireEvent(measurement, 'layout', { nativeEvent: { layout: { width: 60 } } });
  const surfaceWidth = () =>
    page
      .UNSAFE_getAllByType(Animated.View)
      .map((node) => StyleSheet.flatten(node.props.style)?.width)
      .find((width) => typeof width?.__getValue === 'function')
      .__getValue();
  expect(surfaceWidth()).toBe(control.md);
  fireEvent.press(page.getByRole('button', { name: '删除甲' }));
  expect(timing).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
      isInteraction: false,
    })
  );
  const progress = timing.mock.calls[0]?.[0];
  if (!(progress instanceof Animated.Value)) throw new Error('缺少转场进度');
  act(() => progress.setValue(0.5));
  const intermediateWidth = surfaceWidth();
  expect(intermediateWidth).toBeGreaterThan(control.md);
  act(() => progress.setValue(1));
  expect(intermediateWidth).toBeLessThan(surfaceWidth());
  const confirm = pressHandler(page.getByRole('button', { name: '确认删除' }));
  act(() => {
    confirm();
    confirm();
  });
  expect(execute).toHaveBeenCalledTimes(1);
  expect(stop).toHaveBeenCalled();
  expect(timing).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ toValue: 0 })
  );
});

test('减少动态效果时直接切换且保持自定义确认文案与颜色', () => {
  jest.spyOn(reanimated, 'useReducedMotion').mockReturnValue(true);
  const timing = jest.spyOn(Animated, 'timing');
  const execute = jest.fn();
  const page = render(
    <ThemeProvider>
      <IconButton
        {...common}
        color={lightColors.primary}
        onPress={execute}
        confirmation={{ label: '确认重置' }}
      />
    </ThemeProvider>
  );
  fireEvent.press(page.getByRole('button', { name: '删除甲' }));
  expect(page.getByRole('button', { name: '确认重置' })).toBeOnTheScreen();
  const label = page.getByText('确认重置');
  expect(label).toHaveStyle({ color: lightColors.primary });
  fireEvent.press(page.getByRole('button', { name: '确认重置' }));
  expect(execute).toHaveBeenCalledTimes(1);
  expect(timing).not.toHaveBeenCalled();
});

test.each([1, 1.3])(
  '确认文字在字号 %s 下独立于动画宽度测量，显示与测量使用同一字号',
  (fontScale) => {
    const page = render(
      <ThemeProvider fontScale={fontScale}>
        <IconButton
          {...common}
          size="sm"
          onPress={() => {}}
          confirmation={{ label: '确认删除' }}
        />
      </ThemeProvider>
    );
    const content = page.UNSAFE_getAllByType(Animated.View).find((node) => {
      const width = StyleSheet.flatten(node.props.style)?.width;
      return typeof width?.__getValue === 'function';
    });
    if (!content) throw new Error('缺少确认内容');
    // Yoga 的 column 绝对定位子节点会受父宽约束，不能用它测量完整文字。
    expect(StyleSheet.flatten(content.props.style)).toMatchObject({
      flexDirection: 'row',
      height: control.sm,
    });
    const labels = page.UNSAFE_getAllByType(Text);
    expect(labels).toHaveLength(2);
    for (const label of labels) {
      expect(StyleSheet.flatten(label.props.style)).toMatchObject({
        fontSize: typography.xxs * fontScale,
      });
      expect(label.props.numberOfLines).toBe(1);
    }
  }
);
