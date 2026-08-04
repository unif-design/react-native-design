import React from 'react';
import { Image } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Avatar, Logo, Thumbnail } from '@unif/react-native-design';
import App from '../App';
import {
  installReducedMotionMock,
  restoreNativeMocks,
} from './helpers/nativeMocks';
import { createShowcaseStateCoverage } from './helpers/showcaseStateCoverage';

jest.mock('react-native-safe-area-context', () => {
  const safeAreaMock = jest.requireActual(
    'react-native-safe-area-context/jest/mock'
  ).default;
  return {
    ...safeAreaMock,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('../../../node_modules/react-native-safe-area-context', () => {
  return jest.requireActual(
    '../../../node_modules/react-native-safe-area-context/jest/mock'
  ).default;
});

jest.mock(
  '../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
  () => 1
);

function enterMedia(): void {
  fireEvent.press(screen.getByRole('button', { name: /媒体展示/ }));
}

function componentByTestID<T extends React.ComponentType<never>>(
  component: T,
  testID: string
) {
  const found = screen
    .UNSAFE_getAllByType(component)
    .find((node) => node.props.testID === testID);
  if (!found) throw new Error(`未找到组件：${testID}`);
  return found;
}

beforeEach(() => {
  installReducedMotionMock(false);
});

afterEach(() => {
  restoreNativeMocks();
  jest.restoreAllMocks();
});

test('Avatar 覆盖五档尺寸、四种 variant、monogram、本地/HTTPS 与真实 error fallback', () => {
  render(<App />);
  enterMedia();
  const stateCoverage = createShowcaseStateCoverage('Avatar');

  expect(screen.getByTestId('media-screen')).toBeOnTheScreen();
  const avatars = screen
    .UNSAFE_getAllByType(Avatar)
    .filter((node) => String(node.props.testID).startsWith('media-avatar-'));
  expect(
    avatars
      .filter((node) =>
        String(node.props.testID).startsWith('media-avatar-size')
      )
      .map((node) => node.props.size)
  ).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
  stateCoverage.consume('avatar.sizes');
  expect(
    avatars
      .filter((node) =>
        String(node.props.testID).startsWith('media-avatar-variant')
      )
      .map((node) => node.props.variant)
  ).toEqual(['brand', 'info', 'soft', 'neutral']);
  stateCoverage.consume('avatar.variants');
  expect(componentByTestID(Avatar, 'media-avatar-local').props.source).toEqual(
    expect.anything()
  );
  expect(componentByTestID(Avatar, 'media-avatar-remote').props.source).toEqual(
    {
      uri: 'https://images.example.com/unif-avatar.png',
    }
  );
  stateCoverage.consume('avatar.image');
  expect(
    componentByTestID(Avatar, 'media-avatar-invalid').findAllByType(Image)
  ).toHaveLength(0);

  const remoteAvatar = componentByTestID(Avatar, 'media-avatar-remote');
  fireEvent(remoteAvatar.findByType(Image), 'error');
  expect(screen.getByText('远程头像')).toBeOnTheScreen();
  expect(screen.getByLabelText('远程头像')).toBeOnTheScreen();
  stateCoverage.consume('avatar.initial-fallback');
  stateCoverage.expectComplete();
});

test('Thumbnail 覆盖 uri/source、三档尺寸、selected、具名/装饰与失败后固定 frame', () => {
  render(<App />);
  enterMedia();
  const stateCoverage = createShowcaseStateCoverage('Thumbnail');

  expect(
    componentByTestID(Thumbnail, 'media-thumbnail-uri-sm').props
  ).toMatchObject({
    uri: 'https://images.example.com/unif-avatar.png',
    size: 'sm',
    accessibilityLabel: '远程缩略图',
  });
  stateCoverage.consume('thumbnail.sources');
  expect(
    componentByTestID(Thumbnail, 'media-thumbnail-source-md').props
  ).toMatchObject({
    source: expect.anything(),
    size: 'md',
    selected: true,
    accessibilityLabel: '本地缩略图',
  });
  stateCoverage.consume('thumbnail.selected');
  expect(
    componentByTestID(Thumbnail, 'media-thumbnail-source-lg').props
  ).toMatchObject({
    size: 'lg',
  });
  stateCoverage.consume('thumbnail.sizes');
  expect(
    componentByTestID(Thumbnail, 'media-thumbnail-source-lg').props
      .accessibilityLabel
  ).toBeUndefined();
  expect(screen.getByRole('image', { name: '远程缩略图' })).toBeOnTheScreen();
  expect(
    screen.getByRole('image', { name: '本地缩略图' }).props.accessibilityState
      ?.selected
  ).toBeUndefined();
  expect(
    componentByTestID(Thumbnail, 'media-thumbnail-source-lg').findByType(Image)
      .props
  ).toMatchObject({
    accessible: false,
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
  });
  stateCoverage.consume('thumbnail.a11y-name');

  const remoteThumbnail = componentByTestID(
    Thumbnail,
    'media-thumbnail-uri-sm'
  );
  fireEvent(remoteThumbnail.findByType(Image), 'error');
  expect(screen.getByTestId('media-thumbnail-uri-sm')).toBeOnTheScreen();
  expect(
    screen.queryByRole('image', { name: '远程缩略图' })
  ).not.toBeOnTheScreen();
  expect(screen.getByText('失败后保留固定缩略图框')).toBeOnTheScreen();
  stateCoverage.consume('thumbnail.load-error');
  stateCoverage.expectComplete();
});

test('Logo 只用本地 fixture，并区分具名与装饰图片的尺寸圆角', () => {
  render(<App />);
  enterMedia();
  const stateCoverage = createShowcaseStateCoverage('Logo');

  expect(componentByTestID(Logo, 'media-logo-named').props).toMatchObject({
    source: expect.anything(),
    size: 72,
    borderRadius: 18,
    accessibilityLabel: 'Unif 示例标志',
  });
  stateCoverage.consume('logo.source', 'logo.sizes', 'logo.border-radius');
  expect(componentByTestID(Logo, 'media-logo-decorative').props).toMatchObject({
    source: expect.anything(),
    size: 48,
  });
  expect(
    componentByTestID(Logo, 'media-logo-decorative').props.accessibilityLabel
  ).toBeUndefined();
  expect(
    screen.getByRole('image', { name: 'Unif 示例标志' })
  ).toBeOnTheScreen();
  expect(
    screen.getByTestId('media-logo-decorative', {
      includeHiddenElements: true,
    }).props
  ).toMatchObject({
    accessible: false,
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
  });
  stateCoverage.consume('logo.a11y-mode');
  stateCoverage.expectComplete();
});

test('远程 URI 只接受 HTTPS，跨路由保留合法值且结果/a11y/testID 不泄露原文', () => {
  render(<App />);
  enterMedia();
  const input = screen.getByLabelText('远程头像地址');
  const unsafeUri = 'http://private.example.com/user-secret.png';
  fireEvent.changeText(input, unsafeUri);
  fireEvent.press(screen.getByRole('button', { name: '应用远程头像地址' }));
  expect(componentByTestID(Avatar, 'media-avatar-remote').props.source).toEqual(
    { uri: 'https://images.example.com/unif-avatar.png' }
  );
  expect(
    screen.getByText('最新结果：Avatar · 更新来源 · 地址未通过 HTTPS 校验')
  ).toBeOnTheScreen();
  expect(
    screen.getByText('最新结果：Avatar · 更新来源 · 地址未通过 HTTPS 校验')
      .props.children
  ).not.toContain(unsafeUri);

  const validUri = 'https://cdn.example.com/new-avatar.png';
  fireEvent.changeText(screen.getByLabelText('远程头像地址'), validUri);
  fireEvent.press(screen.getByRole('button', { name: '应用远程头像地址' }));
  expect(componentByTestID(Avatar, 'media-avatar-remote').props.source).toEqual(
    { uri: validUri }
  );
  expect(
    screen.getByText('最新结果：Avatar · 更新来源 · 已切换远程头像')
  ).toBeOnTheScreen();

  const rawLeakSurfaces = [
    ...screen
      .UNSAFE_getAllByType(Image)
      .flatMap((node) => [node.props.testID, node.props.accessibilityLabel]),
    ...screen
      .UNSAFE_getAllByType(Avatar)
      .flatMap((node) => [node.props.testID, node.props.label]),
    ...screen
      .UNSAFE_getAllByType(Thumbnail)
      .flatMap((node) => [node.props.testID, node.props.accessibilityLabel]),
  ];
  expect(JSON.stringify(rawLeakSurfaces)).not.toContain(validUri);
  expect(
    screen.getByText('最新结果：Avatar · 更新来源 · 已切换远程头像').props
      .children
  ).not.toContain(validUri);

  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  enterMedia();
  expect(componentByTestID(Avatar, 'media-avatar-remote').props.source).toEqual(
    { uri: validUri }
  );
  fireEvent.press(screen.getByRole('button', { name: '重置本场景' }));
  expect(componentByTestID(Avatar, 'media-avatar-remote').props.source).toEqual(
    { uri: 'https://images.example.com/unif-avatar.png' }
  );
});
