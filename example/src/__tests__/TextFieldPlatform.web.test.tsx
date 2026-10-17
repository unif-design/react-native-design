import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import { Textarea, ThemeProvider } from '@unif/react-native-design';

// Select the actual Web implementation as Metro/Webpack does for this platform.
jest.mock('../../../src/components/ui/TextField/useMultilineLayout', () =>
  jest.requireActual(
    '../../../src/components/ui/TextField/useMultilineLayout.web'
  )
);

test('Web Textarea measures its real platform hook and forwards width without forcing scrolling', () => {
  const prototype = TextInput.prototype;
  const values = {
    style: { height: '44px', minHeight: '0px' },
    scrollTop: 0,
    scrollHeight: 18,
  };
  const original = new Map(
    Object.keys(values).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(prototype, key),
    ])
  );
  Object.entries(values).forEach(([key, value]) =>
    Object.defineProperty(prototype, key, {
      configurable: true,
      writable: true,
      value,
    })
  );
  try {
    const layout = jest.fn();
    const page = render(
      <ThemeProvider>
        <Textarea
          value="短内容"
          onChangeText={jest.fn()}
          minHeight={44}
          maxHeight={100}
          onLayout={layout}
          testID="area"
        />
      </ThemeProvider>
    );
    const input = page.getByTestId('area-input');
    expect(input.props.scrollEnabled).toBe(false);
    const event = {
      nativeEvent: { layout: { width: 100, height: 44, x: 0, y: 0 } },
    };
    fireEvent(input, 'layout', event);
    expect(layout).toHaveBeenCalledWith(event);
    expect(values.style).toEqual({ height: '44px', minHeight: '0px' });
  } finally {
    original.forEach((descriptor, key) => {
      if (descriptor) Object.defineProperty(prototype, key, descriptor);
      else Reflect.deleteProperty(prototype, key);
    });
  }
});
