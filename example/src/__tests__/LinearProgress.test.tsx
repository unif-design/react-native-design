import React from 'react';
import { StyleSheet, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import {
  LinearProgress,
  ThemeProvider,
  lightColors,
  darkColors,
} from '@unif/react-native-design';

test('横向进度随真实值更新，重置与完成保持相同几何及读屏语义', () => {
  const page = render(<LinearProgress value={0} testID="progress" />);
  const bar = () => screen.getByRole('progressbar', { name: '进度' });
  const fill = () => bar().findByProps({ 'aria-hidden': true });
  expect(bar()).toBe(screen.getByTestId('progress'));
  expect(bar().props.pointerEvents).toBe('none');
  expect(StyleSheet.flatten(bar().props.style)).toMatchObject({
    height: 2,
    backgroundColor: lightColors.surfaceContainer,
  });
  expect(StyleSheet.flatten(fill().props.style)).toMatchObject({
    height: '100%',
    width: '0%',
    backgroundColor: lightColors.primary,
  });
  expect(fill().props['aria-hidden']).toBe(true);
  for (const value of [0.425, 1, 0]) {
    page.rerender(<LinearProgress value={value} />);
    expect(bar().props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: Math.round(value * 100),
      text: `${Math.round(value * 100)}%`,
    });
    expect(
      screen.UNSAFE_getByType(LinearProgress).findByType(View).props
    ).toMatchObject({
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuenow': Math.round(value * 100),
      'aria-valuetext': `${Math.round(value * 100)}%`,
    });
    expect(StyleSheet.flatten(fill().props.style).width).toBe(
      `${value * 100}%`
    );
  }
});

test.each([
  [-1, 0],
  [2, 100],
  [NaN, 0],
  [Infinity, 0],
])('非法比例 %s 安全收敛为 %s%%', (value, percentage) => {
  render(<LinearProgress value={value} />);
  const bar = screen.getByRole('progressbar');
  expect(bar.props.accessibilityValue.now).toBe(percentage);
  expect(
    StyleSheet.flatten(bar.findByProps({ 'aria-hidden': true }).props.style)
      .width
  ).toBe(`${percentage}%`);
});

test('支持明暗主题、外层定位、显式颜色与高度，异常高度恢复默认', () => {
  const page = render(<LinearProgress value={0.6} />, {
    wrapper: ({ children }) => (
      <ThemeProvider forceScheme="dark">{children}</ThemeProvider>
    ),
  });
  const bar = () => screen.getByRole('progressbar');
  expect(StyleSheet.flatten(bar().props.style).backgroundColor).toBe(
    darkColors.surfaceContainer
  );
  expect(
    StyleSheet.flatten(bar().findByProps({ 'aria-hidden': true }).props.style)
      .backgroundColor
  ).toBe(darkColors.primary);
  page.rerender(
    <LinearProgress
      value={0.6}
      thickness={4}
      color={lightColors.success}
      trackColor={lightColors.outline}
      accessibilityLabel="网页加载进度"
      style={{ position: 'absolute', top: 80, left: 0, right: 0 }}
    />
  );
  expect(screen.getByRole('progressbar', { name: '网页加载进度' })).toBe(bar());
  expect(StyleSheet.flatten(bar().props.style)).toMatchObject({
    height: 4,
    position: 'absolute',
    top: 80,
    backgroundColor: lightColors.outline,
  });
  expect(
    StyleSheet.flatten(bar().findByProps({ 'aria-hidden': true }).props.style)
      .backgroundColor
  ).toBe(lightColors.success);
  for (const thickness of [0, -1, NaN, Infinity]) {
    page.rerender(<LinearProgress value={0.6} thickness={thickness} />);
    expect(StyleSheet.flatten(bar().props.style).height).toBe(2);
  }
});
