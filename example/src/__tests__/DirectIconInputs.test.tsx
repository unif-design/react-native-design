import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SendOutlined } from '@unif/react-native-icons';
import {
  IconButton,
  ThemeProvider,
  darkColors,
} from '@unif/react-native-design';

test('an imported icon keeps control sizing, color and disabled interaction', () => {
  const onPress = jest.fn();
  const content = (disabled: boolean) => (
    <ThemeProvider forceScheme="dark">
      <IconButton
        icon={SendOutlined}
        iconSize={21}
        color={darkColors.primary}
        accessibilityLabel="发送"
        disabled={disabled}
        onPress={onPress}
      />
    </ThemeProvider>
  );
  const page = render(content(false));
  expect(page.UNSAFE_getByType(SendOutlined).props).toMatchObject({
    size: 21,
    color: darkColors.primary,
  });
  fireEvent.press(page.getByRole('button', { name: '发送' }));
  expect(onPress).toHaveBeenCalledTimes(1);
  page.rerender(content(true));
  fireEvent.press(page.getByRole('button', { name: '发送' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});
