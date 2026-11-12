import React from 'react';
import { ActivityIndicator } from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import { render } from '@testing-library/react-native';
import {
  ActionMenuContent,
  Button,
  MotionScope,
  Skeleton,
  Spinner,
  ThemeProvider,
} from '@unif/react-native-design';

test('隐藏范围不启动原生脉冲和旋转，隐藏后取消驱动，恢复保持内容实例', () => {
  const repeat = jest.spyOn(Reanimated, 'withRepeat');
  const cancel = jest.spyOn(Reanimated, 'cancelAnimation');
  const content = (active: boolean) => (
    <ThemeProvider>
      <MotionScope active={active}>
        <Skeleton testID="skeleton" />
        <Spinner testID="spinner" />
      </MotionScope>
    </ThemeProvider>
  );
  const page = render(content(false));
  const skeleton = page.getByTestId('skeleton', {
    includeHiddenElements: true,
  });
  const spinner = page.getByTestId('spinner', { includeHiddenElements: true });
  expect(repeat).not.toHaveBeenCalled();
  page.rerender(content(true));
  expect(repeat).toHaveBeenCalledTimes(2);
  page.rerender(content(false));
  expect(cancel).toHaveBeenCalledTimes(2);
  expect(page.getByTestId('skeleton', { includeHiddenElements: true })).toBe(
    skeleton
  );
  expect(page.getByTestId('spinner', { includeHiddenElements: true })).toBe(
    spinner
  );
  page.rerender(content(true));
  expect(repeat).toHaveBeenCalledTimes(4);
});

test('按钮与菜单原生加载指示随页面暂停，保留色彩、尺寸和忙碌保护', () => {
  const content = (active: boolean) => (
    <ThemeProvider>
      <MotionScope active={active}>
        <Button loading label="保存" onPress={() => {}} />
        <ActionMenuContent
          presentation="popover"
          actions={[
            { id: 'save', label: '保存菜单', loading: true, onPress() {} },
          ]}
          onClose={() => {}}
        />
      </MotionScope>
    </ThemeProvider>
  );
  const page = render(content(false));
  const indicators = () => page.UNSAFE_getAllByType(ActivityIndicator);
  expect(indicators().map((node) => node.props.animating)).toEqual([
    false,
    false,
  ]);
  const appearance = indicators().map((node) => [
    node.props.color,
    node.props.size,
  ]);
  expect(page.getByRole('button', { name: '保存' })).toBeDisabled();
  page.rerender(content(true));
  expect(indicators().map((node) => node.props.animating)).toEqual([
    true,
    true,
  ]);
  expect(
    indicators().map((node) => [node.props.color, node.props.size])
  ).toEqual(appearance);
  expect(page.getByRole('button', { name: '保存' })).toBeDisabled();
});
