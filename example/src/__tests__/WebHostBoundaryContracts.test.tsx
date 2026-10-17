import React, { useContext } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Platform, View } from 'react-native';
import { SearchOutlined } from '@unif/react-native-icons';
import {
  IconButton,
  InlineConfirmScope,
  ThemeProvider,
} from '@unif/react-native-design';
import { InlineConfirmContext } from '../../../src/components/ui/InlineConfirm/context';
import type { InlineConfirmCoordinator } from '../../../src/components/ui/InlineConfirm/types';
import { Spinner } from '../../../src/components/ui/Spinner/Spinner.web';
import { Reveal } from '../../../src/components/ui/Reveal/Reveal.web';

const globals = [
  'document',
  'requestAnimationFrame',
  'cancelAnimationFrame',
] as const;
let originalGlobals: PropertyDescriptor[];
beforeEach(() => {
  originalGlobals = globals.map(
    (key) => Object.getOwnPropertyDescriptor(globalThis, key)!
  );
  jest.useFakeTimers();
});
afterEach(() => {
  globals.forEach((key, index) => {
    const descriptor = originalGlobals[index];
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  });
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('Web spinner registers static keyframes only once and applies animation to its DOM host', () => {
  const nodes = new Map<string, { id: string; textContent: string }>();
  const appendChild = jest.fn((node: { id: string; textContent: string }) =>
    nodes.set(node.id, node)
  );
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      getElementById: (id: string) => nodes.get(id),
      createElement: () => ({ id: '', textContent: '' }),
      head: { appendChild },
    },
  });
  // RN's Jest host is a class instance. Supply the browser's native style surface.
  const prototype = View.prototype;
  const previousStyle = Object.getOwnPropertyDescriptor(prototype, 'style');
  const style: { animation?: string } = {};
  Object.defineProperty(prototype, 'style', {
    configurable: true,
    value: style,
  });
  try {
    const page = render(
      <ThemeProvider>
        <Spinner testID="one" />
        <Spinner testID="two" />
      </ThemeProvider>
    );
    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(nodes.get('unif-spinner-spin-keyframes')?.textContent).toContain(
      'rotate(360deg)'
    );
    expect(style.animation).toBe('unif-spinner-spin 900ms linear infinite');
    expect(
      page.getByTestId('one', { includeHiddenElements: true })
    ).toBeTruthy();
  } finally {
    if (previousStyle) Object.defineProperty(prototype, 'style', previousStyle);
    else Reflect.deleteProperty(prototype, 'style');
  }
});

test('Web confirmation owns only its DOM subtree and stops inner pointer/touch propagation', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  let scope: InlineConfirmCoordinator | undefined;
  function Observer() {
    scope = useContext(InlineConfirmContext);
    return null;
  }
  const cancel = jest.fn();
  const page = render(
    <ThemeProvider>
      <InlineConfirmScope testID="scope">
        <Observer />
        <IconButton
          icon={SearchOutlined}
          accessibilityLabel="执行"
          onPress={jest.fn()}
          confirmation={{ label: '确认执行', onCancel: cancel }}
        />
      </InlineConfirmScope>
    </ThemeProvider>
  );
  const claim = jest.spyOn(scope!, 'claim');
  fireEvent.press(page.getByRole('button', { name: '执行' }));
  const owner = claim.mock.calls[0]![0];
  expect(owner.containsTarget(null)).toBe(false);
  expect(owner.containsTarget(1)).toBe(false);
  expect(owner.containsTarget({})).toBe(false);
  const prototype = View.prototype;
  const previousContains = Object.getOwnPropertyDescriptor(
    prototype,
    'contains'
  );
  try {
    Object.defineProperty(prototype, 'contains', {
      configurable: true,
      value: false,
    });
    expect(owner.containsTarget({})).toBe(false);
    const inside = {};
    Object.defineProperty(prototype, 'contains', {
      configurable: true,
      value: (target: unknown) => target === inside,
    });
    expect(owner.containsTarget(inside)).toBe(true);
    expect(owner.containsTarget({})).toBe(false);
    const stopPropagation = jest.fn();
    const button = page.getByRole('button', { name: '确认执行' });
    fireEvent(button, 'touchStart', { stopPropagation });
    fireEvent(button, 'pointerDown', { stopPropagation });
    expect(stopPropagation).toHaveBeenCalledTimes(2);
    const host = page.getByTestId('scope');
    act(() => host.props.onStartShouldSetResponderCapture({ target: inside }));
    fireEvent(host, 'mouseUp');
    act(() => jest.runOnlyPendingTimers());
    expect(cancel).not.toHaveBeenCalled();
  } finally {
    if (previousContains)
      Object.defineProperty(prototype, 'contains', previousContains);
    else Reflect.deleteProperty(prototype, 'contains');
  }
  page.unmount();
  expect(owner.containsTarget({})).toBe(false);
});

test('blank confirmation copy has no action and stays safe to display', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const execute = jest.fn();
  const page = render(
    <ThemeProvider>
      <IconButton
        icon={SearchOutlined}
        accessibilityLabel="执行"
        onPress={execute}
        confirmation={{ label: ' ' }}
        testID="blank-confirm"
      />
    </ThemeProvider>
  );
  fireEvent.press(page.getByTestId('blank-confirm'));
  expect(execute).not.toHaveBeenCalled();
});

test('Web Reveal handles a blocked frame API getter without hiding content', () => {
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    get() {
      throw new Error('frame API blocked');
    },
  });
  const page = render(
    <ThemeProvider>
      <Reveal testID="visible">
        <View />
      </Reveal>
    </ThemeProvider>
  );
  expect(page.getByTestId('visible')).toHaveStyle({ opacity: 1 });
});

test('Web spinner can render before a DOM style surface is available', () => {
  Reflect.deleteProperty(globalThis, 'document');
  const page = render(
    <ThemeProvider>
      <Spinner testID="no-dom" />
    </ThemeProvider>
  );
  expect(
    page.getByTestId('no-dom', { includeHiddenElements: true })
  ).toBeTruthy();
});
