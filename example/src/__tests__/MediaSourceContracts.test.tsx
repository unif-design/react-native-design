import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Image, StyleSheet, Text } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import {
  Avatar,
  DrawerHeader,
  ThemeProvider,
  Thumbnail,
} from '@unif/react-native-design';

const consumers = {
  Avatar: (source: ImageSourcePropType) => (
    <Avatar label="头像占位" source={source} />
  ),
  Thumbnail: (source: ImageSourcePropType) => (
    <Thumbnail source={source} fallback={<Text>图片占位</Text>} />
  ),
  DrawerHeader: (source: ImageSourcePropType) => (
    <DrawerHeader name="王" source={source} />
  ),
};

test('Avatar applies its default circular frame and the explicit square frame in a mounted consumer', () => {
  const view = render(<Avatar label="王" testID="avatar-frame" />, {
    wrapper: ThemeProvider,
  });
  const circle = StyleSheet.flatten(
    screen.getByTestId('avatar-frame').props.style
  );
  expect(circle.width).toBe(circle.height);
  expect(circle.borderRadius).toBe(circle.width / 2);

  view.rerender(
    <Avatar label="王" size="lg" shape="square" testID="avatar-frame" />
  );
  const square = StyleSheet.flatten(
    screen.getByTestId('avatar-frame').props.style
  );
  expect(square.width).toBeGreaterThan(circle.width);
  expect(square.width).toBe(square.height);
  expect(square.borderRadius).toBeGreaterThan(0);
  expect(square.borderRadius).toBeLessThan(square.width / 2);
});

describe.each(Object.entries(consumers))(
  '%s source snapshots',
  (_name, content) => {
    test('equivalent large sources preserve the native image input across parent renders', () => {
      const uri = 'data:image/jpeg;base64,' + 'A'.repeat(4 * 1024 * 1024);
      const view = render(
        content({ uri, headers: { Accept: 'image/jpeg', Token: 'a' } }),
        {
          wrapper: ThemeProvider,
        }
      );
      const source = screen.UNSAFE_getByType(Image).props.source;
      expect(Object.isFrozen(source)).toBe(true);
      const stringify = jest.spyOn(JSON, 'stringify');
      try {
        view.rerender(
          content({ headers: { Token: 'a', Accept: 'image/jpeg' }, uri })
        );

        // Include the complete component path, including platform selection.
        const uriSerializations = stringify.mock.calls.filter(
          ([value]) => value === uri
        ).length;
        expect(uriSerializations).toBe(0);
        expect(screen.UNSAFE_getByType(Image).props.source === source).toBe(
          true
        );
      } finally {
        stringify.mockRestore();
      }
    });

    test('in-place header changes produce a fresh snapshot and old image errors stay isolated', () => {
      const source = {
        uri: 'https://example.test/a.png',
        headers: { Token: 'first' },
      };
      const view = render(content(source), { wrapper: ThemeProvider });
      const firstImage = screen.UNSAFE_getByType(Image);
      const firstSnapshot = firstImage.props.source;
      const oldError = firstImage.props.onError;
      fireEvent(firstImage, 'error');
      expect(screen.UNSAFE_queryByType(Image)).toBeNull();

      source.headers.Token = 'second';
      view.rerender(content(source));

      expect(firstSnapshot.headers.Token).toBe('first');
      expect(screen.UNSAFE_getByType(Image).props.source.headers.Token).toBe(
        'second'
      );
      act(() => oldError());
      expect(screen.UNSAFE_getByType(Image).props.source.headers.Token).toBe(
        'second'
      );
    });

    test('equivalent renders preserve failure and a changed descriptor cannot reuse a valid image', () => {
      const source = { uri: 'https://example.test/a.png' };
      const view = render(content(source), { wrapper: ThemeProvider });
      fireEvent(screen.UNSAFE_getByType(Image), 'error');
      view.rerender(content({ ...source }));
      expect(screen.UNSAFE_queryByType(Image)).toBeNull();

      let getterReads = 0;
      Object.defineProperty(source, 'uri', {
        enumerable: true,
        get() {
          getterReads += 1;
          return 'https://example.test/b.png';
        },
      });
      view.rerender(content(source));
      expect(getterReads).toBe(0);
      expect(screen.UNSAFE_queryByType(Image)).toBeNull();
    });
  }
);
