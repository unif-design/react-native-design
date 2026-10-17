import React, { useContext } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { InlineConfirmScope } from '@unif/react-native-design';
import { InlineConfirmContext } from '../../../src/components/ui/InlineConfirm/context';
import type {
  InlineConfirmCoordinator,
  InlineConfirmOwner,
} from '../../../src/components/ui/InlineConfirm/types';

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test.each(['ios', 'web'] as const)(
  '%s 作用域交付全部外部事件，释放去重且卸载取消延迟任务',
  (os) => {
    jest.replaceProperty(Platform, 'OS', os);
    const events = {
      onTouchStart: jest.fn(),
      onTouchEnd: jest.fn(),
      onTouchCancel: jest.fn(),
      onPointerDown: jest.fn(),
      onPointerUp: jest.fn(),
      onPointerCancel: jest.fn(),
      onStartShouldSetResponderCapture: jest.fn(() => true),
      onAccessibilityEscape: jest.fn(),
    };
    let scope: InlineConfirmCoordinator | undefined;
    function Consumer() {
      scope = useContext(InlineConfirmContext);
      return null;
    }
    const page = render(
      <InlineConfirmScope {...events} testID="scope">
        <Consumer />
      </InlineConfirmScope>
    );
    const host = page.getByTestId('scope');
    const owner: InlineConfirmOwner = {
      cancel: jest.fn(),
      containsTarget: jest.fn((target) => target === 'inside'),
    };
    fireEvent(host, 'touchEnd', {});
    act(() => scope?.claim(owner));
    act(() => scope?.claim(owner));
    expect(owner.cancel).not.toHaveBeenCalled();
    expect(
      host.props.onStartShouldSetResponderCapture({ target: 'inside' })
    ).toBe(true);
    expect(events.onStartShouldSetResponderCapture).toHaveBeenCalledWith({
      target: 'inside',
    });
    if (os === 'web') {
      fireEvent(host, 'mouseUp', {});
      act(() => jest.runOnlyPendingTimers());
      expect(owner.cancel).not.toHaveBeenCalled();
      host.props.onStartShouldSetResponderCapture({ target: 'outside' });
      fireEvent(host, 'touchEndCapture', {});
      act(() => jest.runOnlyPendingTimers());
      expect(owner.cancel).toHaveBeenCalledTimes(1);
      act(() => scope?.claim(owner));
      host.props.onStartShouldSetResponderCapture({ target: 'outside' });
      fireEvent(host, 'touchCancelCapture', {});
      act(() => jest.runOnlyPendingTimers());
      expect(owner.cancel).toHaveBeenCalledTimes(2);
      act(() => scope?.claim(owner));
    }
    fireEvent(host, 'touchStart', {});
    fireEvent(host, 'touchEnd', {});
    fireEvent(host, 'pointerDown', {});
    fireEvent(host, 'pointerCancel', {});
    fireEvent(host, 'touchStart', {});
    fireEvent(host, 'touchCancel', {});
    fireEvent(host, 'pointerDown', {});
    fireEvent(host, 'pointerUp', {});
    for (const name of [
      'onTouchStart',
      'onTouchEnd',
      'onTouchCancel',
      'onPointerDown',
      'onPointerUp',
      'onPointerCancel',
    ] as const)
      expect(events[name]).toHaveBeenCalled();
    const before = (owner.cancel as jest.Mock).mock.calls.length;
    page.unmount();
    act(() => jest.runOnlyPendingTimers());
    expect(owner.cancel).toHaveBeenCalledTimes(before);
  }
);

test('无调用方捕获处理器时保留 responder，escape 向调用方交付且无活动项仍安全', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  const escape = jest.fn();
  const page = render(
    <InlineConfirmScope testID="scope" onAccessibilityEscape={escape} />
  );
  const host = page.getByTestId('scope');
  expect(host.props.onStartShouldSetResponderCapture({ target: {} })).toBe(
    false
  );
  fireEvent(host, 'accessibilityEscape');
  expect(escape).toHaveBeenCalledTimes(1);
});

test('新目标提交前的子布局事件不能确认旧目标', () => {
  const { useInlineConfirmation } =
    require('../../../src/components/ui/InlineConfirm/useInlineConfirmation') as typeof import('../../../src/components/ui/InlineConfirm/useInlineConfirmation');
  const onConfirm = jest.fn();
  const contains = () => false;
  let control: ReturnType<typeof useInlineConfirmation>;
  function Child({ press, deliver }: { press: () => void; deliver: boolean }) {
    const latestPress = React.useRef(press);
    latestPress.current = press;
    React.useLayoutEffect(() => {
      if (deliver) latestPress.current();
    }, [deliver]);
    return null;
  }
  function Owner({ target }: { target: string }) {
    control = useInlineConfirmation(
      { confirmationKey: target, onConfirm },
      contains
    );
    return <Child press={control.press} deliver={target === 'new'} />;
  }
  const page = render(<Owner target="old" />);
  act(() => control.press());
  expect(control!.confirming).toBe(true);
  page.rerender(<Owner target="new" />);
  expect(onConfirm).not.toHaveBeenCalled();
  expect(control!.confirming).toBe(false);
});
