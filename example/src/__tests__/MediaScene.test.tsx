import React from 'react';
import { Image } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Avatar, Logo, Thumbnail } from '@unif/react-native-design';
import App from '../App';
import { restoreNativeMocks } from './helpers/nativeMocks';
import { createShowcaseStateCoverage } from './helpers/showcaseStateCoverage';

const SUCCESS_FIXTURE_URI =
  'https://unif-design.github.io/react-native-design/img/logo.png';
const FAILURE_FIXTURE_URI =
  'https://unif-design.github.io/react-native-design/example-fixtures/media-decode-failure-v1.png';

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
  stateCoverage.prove('avatar.sizes', () => {
    expect(
      avatars
        .filter((node) =>
          String(node.props.testID).startsWith('media-avatar-size')
        )
        .map((node) => node.props.size)
    ).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
  });
  expect(
    avatars
      .filter((node) =>
        String(node.props.testID).startsWith('media-avatar-variant')
      )
      .map((node) => node.props.variant)
  ).toEqual(['brand', 'info', 'soft', 'neutral']);
  stateCoverage.prove('avatar.variants', () => {
    expect(
      avatars
        .filter((node) =>
          String(node.props.testID).startsWith('media-avatar-variant')
        )
        .map((node) => node.props.variant)
    ).toEqual(['brand', 'info', 'soft', 'neutral']);
  });
  expect(componentByTestID(Avatar, 'media-avatar-local').props.source).toEqual(
    expect.anything()
  );
  expect(componentByTestID(Avatar, 'media-avatar-remote').props.source).toEqual(
    {
      uri: SUCCESS_FIXTURE_URI,
    }
  );
  stateCoverage.prove('avatar.image', () => {
    expect(
      componentByTestID(Avatar, 'media-avatar-remote').props.source
    ).toEqual({ uri: SUCCESS_FIXTURE_URI });
  });

  const remoteAvatar = componentByTestID(Avatar, 'media-avatar-remote');
  fireEvent(remoteAvatar.findByType(Image), 'load');
  expect(remoteAvatar.findAllByType(Image)).toHaveLength(1);
  expect(screen.getByLabelText('远程头像')).toBeOnTheScreen();

  const failureAvatar = componentByTestID(Avatar, 'media-avatar-failure');
  expect(failureAvatar.props.source).toEqual({ uri: FAILURE_FIXTURE_URI });
  fireEvent(failureAvatar.findByType(Image), 'error');
  expect(screen.getByText('失效头像')).toBeOnTheScreen();
  expect(screen.getByLabelText('失效头像')).toBeOnTheScreen();
  stateCoverage.prove('avatar.initial-fallback', () => {
    expect(screen.getByLabelText('失效头像')).toBeOnTheScreen();
  });
  stateCoverage.expectComplete();
});

test('Thumbnail 覆盖 uri/source、三档尺寸、selected、具名/装饰与失败后固定 frame', () => {
  render(<App />);
  enterMedia();
  const stateCoverage = createShowcaseStateCoverage('Thumbnail');

  expect(
    componentByTestID(Thumbnail, 'media-thumbnail-uri-sm').props
  ).toMatchObject({
    uri: SUCCESS_FIXTURE_URI,
    size: 'sm',
    accessibilityLabel: '远程缩略图',
  });
  stateCoverage.prove('thumbnail.sources', () => {
    expect(
      componentByTestID(Thumbnail, 'media-thumbnail-uri-sm').props
    ).toMatchObject({
      uri: SUCCESS_FIXTURE_URI,
      size: 'sm',
    });
  });
  expect(
    componentByTestID(Thumbnail, 'media-thumbnail-source-md').props
  ).toMatchObject({
    source: expect.anything(),
    size: 'md',
    selected: true,
    accessibilityLabel: '本地缩略图',
  });
  stateCoverage.prove('thumbnail.selected', () => {
    expect(
      componentByTestID(Thumbnail, 'media-thumbnail-source-md').props.selected
    ).toBe(true);
  });
  expect(
    componentByTestID(Thumbnail, 'media-thumbnail-source-lg').props
  ).toMatchObject({
    size: 'lg',
  });
  stateCoverage.prove('thumbnail.sizes', () => {
    expect(
      componentByTestID(Thumbnail, 'media-thumbnail-source-lg').props.size
    ).toBe('lg');
  });
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
  stateCoverage.prove('thumbnail.a11y-name', () => {
    expect(screen.getByRole('image', { name: '远程缩略图' })).toBeOnTheScreen();
  });

  const successThumbnail = componentByTestID(
    Thumbnail,
    'media-thumbnail-uri-sm'
  );
  fireEvent(successThumbnail.findByType(Image), 'load');
  expect(successThumbnail.findAllByType(Image)).toHaveLength(1);
  expect(screen.getByRole('image', { name: '远程缩略图' })).toBeOnTheScreen();

  const failureThumbnail = componentByTestID(
    Thumbnail,
    'media-thumbnail-failure'
  );
  expect(failureThumbnail.props.uri).toBe(FAILURE_FIXTURE_URI);
  fireEvent(failureThumbnail.findByType(Image), 'error');
  expect(screen.getByTestId('media-thumbnail-failure')).toBeOnTheScreen();
  expect(
    screen.queryByRole('image', { name: '失效缩略图' })
  ).not.toBeOnTheScreen();
  expect(screen.getByText('失败后保留固定缩略图框')).toBeOnTheScreen();
  stateCoverage.prove('thumbnail.load-error', () => {
    expect(screen.getByText('失败后保留固定缩略图框')).toBeOnTheScreen();
  });
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
  stateCoverage.prove('logo.source', 'logo.sizes', 'logo.border-radius', () => {
    expect(componentByTestID(Logo, 'media-logo-named').props).toMatchObject({
      source: expect.anything(),
      size: 72,
      borderRadius: 18,
    });
  });
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
  stateCoverage.prove('logo.a11y-mode', () => {
    expect(
      screen.getByRole('image', { name: 'Unif 示例标志' })
    ).toBeOnTheScreen();
  });
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
    { uri: SUCCESS_FIXTURE_URI }
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
    { uri: SUCCESS_FIXTURE_URI }
  );
});
