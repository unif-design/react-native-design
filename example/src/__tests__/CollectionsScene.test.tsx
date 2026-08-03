import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  Card,
  Carousel,
  Cell,
  EntryCard,
  Grid,
  Icon,
  List,
  type CarouselRef,
} from '@unif/react-native-design';
import App from '../App';
import {
  installReducedMotionMock,
  restoreNativeMocks,
} from './helpers/nativeMocks';

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

const mockCarouselRef: jest.Mocked<CarouselRef> = {
  prev: jest.fn(),
  next: jest.fn(),
  getCurrentIndex: jest.fn(() => 1),
  scrollTo: jest.fn(),
};
const mockCarouselUnmount = jest.fn();
type MockUpstreamCarouselProps = Readonly<{
  data: unknown[];
  renderItem: (input: {
    item: unknown;
    index: number;
    relativeProgress: { value: number };
  }) => React.ReactElement;
  autoplay?: boolean;
  loop?: boolean;
}>;
const mockUpstreamCarouselProps: MockUpstreamCarouselProps[] = [];

jest.mock('react-native-reanimated-carousel', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  const MockCarousel = ReactModule.forwardRef<
    CarouselRef,
    MockUpstreamCarouselProps
  >((props, ref) => {
    ReactModule.useImperativeHandle(ref, () => mockCarouselRef);
    ReactModule.useEffect(
      () => () => {
        mockCarouselUnmount();
      },
      []
    );
    mockUpstreamCarouselProps.push(props);
    return ReactModule.createElement(
      View,
      null,
      props.data.map((item, index) =>
        ReactModule.createElement(
          ReactModule.Fragment,
          { key: String(index) },
          props.renderItem({
            item,
            index,
            relativeProgress: { value: 0 },
          })
        )
      )
    );
  });

  return {
    Carousel: MockCarousel,
    Pagination: function MockPagination() {
      return ReactModule.createElement(View);
    },
  };
});

jest.mock('../../../node_modules/react-native-reanimated-carousel', () => {
  return jest.requireMock('react-native-reanimated-carousel');
});

jest.mock(
  '../../../node_modules/react-native-reanimated-carousel/src/index.tsx',
  () => jest.requireMock('react-native-reanimated-carousel')
);

function enterCollections(): void {
  fireEvent.press(screen.getByRole('button', { name: /容器与集合/ }));
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
  mockCarouselRef.prev.mockClear();
  mockCarouselRef.next.mockClear();
  mockCarouselRef.getCurrentIndex.mockClear();
  mockCarouselRef.getCurrentIndex.mockReturnValue(1);
  mockCarouselRef.scrollTo.mockClear();
  mockCarouselUnmount.mockClear();
  mockUpstreamCarouselProps.length = 0;
});

afterEach(() => {
  restoreNativeMocks();
  jest.restoreAllMocks();
});

test('Collections 覆盖 Card、Cell/List、Grid 与 EntryCard 的公开分支', () => {
  render(<App />);
  enterCollections();

  expect(screen.getByTestId('collections-screen')).toBeOnTheScreen();
  expect(
    componentByTestID(Card, 'collections-card-default').props
  ).toMatchObject({ variant: 'default' });
  expect(componentByTestID(Card, 'collections-card-plain').props).toMatchObject(
    {
      variant: 'plain',
    }
  );
  expect(componentByTestID(Card, 'collections-card-bare').props).toMatchObject({
    variant: 'default',
    bare: true,
  });
  expect(componentByTestID(Card, 'collections-card-fill').props.fill).toBe(
    true
  );

  expect(
    screen.queryByRole('button', { name: '静态信息' })
  ).not.toBeOnTheScreen();
  expect(screen.getByRole('button', { name: /可操作行/ })).toBeOnTheScreen();
  expect(
    screen.getByRole('switch', { name: '列表内控制项' })
  ).toBeOnTheScreen();
  const disabledCell = screen.getByRole('button', { name: /禁用行/ });
  expect(disabledCell.props.accessibilityState).toMatchObject({
    disabled: true,
  });
  fireEvent.press(disabledCell);
  expect(screen.queryByTestId('result-latest')).not.toBeOnTheScreen();
  expect(
    componentByTestID(Cell, 'collections-cell-danger').props
  ).toMatchObject({
    danger: true,
    arrow: true,
  });
  expect(
    componentByTestID(Cell, 'collections-cell-danger')
      .findAllByType(Icon)
      .some((node) => node.props.name === 'chevron-right')
  ).toBe(false);
  expect(componentByTestID(List, 'collections-list-grouped').props.flush).toBe(
    undefined
  );
  expect(componentByTestID(List, 'collections-list-full').props).toMatchObject({
    flush: true,
    divider: 'full',
  });
  expect(componentByTestID(List, 'collections-list-none').props).toMatchObject({
    flush: true,
    divider: 'none',
  });

  expect(componentByTestID(Grid, 'collections-grid-2').props).toMatchObject({
    columns: 2,
    card: true,
  });
  expect(
    componentByTestID(Grid, 'collections-grid-2').props.onPress
  ).toBeUndefined();
  expect(componentByTestID(Grid, 'collections-grid-4').props).toMatchObject({
    columns: 4,
    card: true,
  });
  expect(componentByTestID(Grid, 'collections-grid-6').props).toMatchObject({
    columns: 6,
    card: false,
  });
  expect(screen.getByRole('button', { name: '消息，0' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: '任务，99+' })).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '消息，0' }));
  expect(
    screen.getByText('最新结果：Grid · 选择 · 已选择消息入口')
  ).toBeOnTheScreen();

  expect(
    componentByTestID(EntryCard, 'collections-entry-static').props.onPress
  ).toBeUndefined();
  expect(
    componentByTestID(EntryCard, 'collections-entry-action').props.sub
  ).toBeUndefined();
  fireEvent.press(screen.getByRole('button', { name: '打开入口' }));
  expect(
    screen.getByText('最新结果：EntryCard · 点击 · 入口卡片已触发')
  ).toBeOnTheScreen();
});

test('Carousel 默认不挂载，开启后覆盖 empty/one/multiple 与 display/action union', () => {
  render(<App />);
  enterCollections();

  expect(screen.UNSAFE_queryAllByType(Carousel)).toHaveLength(0);
  expect(screen.getByText('Carousel 组件未挂载')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '挂载轮播演示' }));

  expect(screen.getByText('空数据由消费方显示空态')).toBeOnTheScreen();
  const carousels = screen.UNSAFE_getAllByType(Carousel);
  expect(carousels).toHaveLength(3);
  expect(
    componentByTestID(Carousel, 'collections-carousel-one').props
  ).toMatchObject({
    data: [{ id: 'one', title: '单页展示' }],
    indicatorPosition: 'bottom',
  });
  expect(
    componentByTestID(Carousel, 'collections-carousel-display').props
  ).toMatchObject({
    indicatorPosition: 'bottom',
  });
  expect(
    componentByTestID(Carousel, 'collections-carousel-display').props
      .onPressItem
  ).toBeUndefined();
  expect(
    componentByTestID(Carousel, 'collections-carousel-display').props
      .getAccessibilityLabel
  ).toBeUndefined();
  expect(
    componentByTestID(Carousel, 'collections-carousel-action').props
  ).toMatchObject({
    indicatorPosition: 'overlay-bottom-right',
    autoplay: false,
    loop: true,
    onPressItem: expect.any(Function),
    getAccessibilityLabel: expect.any(Function),
  });
  expect(
    screen.queryByRole('button', { name: /纯展示甲/ })
  ).not.toBeOnTheScreen();
  fireEvent.press(
    screen.getByRole('button', { name: '可操作甲，第 1 项，共 3 项' })
  );
  expect(
    screen.getByText('最新结果：Carousel · 点击 · 已选择可操作甲')
  ).toBeOnTheScreen();
});

test('Carousel ref 四个公开方法可执行，reduced motion 停止 upstream autoplay', () => {
  const mounted = render(<App />);
  enterCollections();
  fireEvent.press(screen.getByRole('button', { name: '挂载轮播演示' }));
  fireEvent.press(screen.getByRole('switch', { name: '轮播自动播放' }));
  fireEvent.press(screen.getByRole('switch', { name: '轮播循环' }));

  expect(
    mockUpstreamCarouselProps.some((props) => props.autoplay === true)
  ).toBe(true);
  expect(
    componentByTestID(Carousel, 'collections-carousel-action').props.loop
  ).toBe(false);
  fireEvent.press(screen.getByRole('button', { name: '下一项' }));
  fireEvent.press(screen.getByRole('button', { name: '上一项' }));
  fireEvent.press(screen.getByRole('button', { name: '跳到第一项' }));
  fireEvent.press(screen.getByRole('button', { name: '读取当前页' }));
  expect(mockCarouselRef.next).toHaveBeenCalledWith({ animated: true });
  expect(mockCarouselRef.prev).toHaveBeenCalledWith({ animated: true });
  expect(mockCarouselRef.scrollTo).toHaveBeenCalledWith({
    index: 0,
    animated: false,
  });
  expect(mockCarouselRef.getCurrentIndex).toHaveBeenCalledTimes(1);
  expect(
    screen.getByText('最新结果：Carousel · 读取 · 当前为第 2 项')
  ).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  expect(mockCarouselUnmount).toHaveBeenCalledTimes(3);
  enterCollections();
  expect(
    screen.getByRole('switch', { name: '轮播自动播放' }).props
      .accessibilityState
  ).toMatchObject({ checked: true });
  expect(
    screen.getByRole('switch', { name: '轮播循环' }).props.accessibilityState
  ).toMatchObject({ checked: false });
  expect(screen.UNSAFE_getAllByType(Carousel)).toHaveLength(3);
  mounted.unmount();

  restoreNativeMocks();
  installReducedMotionMock(true);
  mockUpstreamCarouselProps.length = 0;
  render(<App />);
  enterCollections();
  fireEvent.press(screen.getByRole('button', { name: '挂载轮播演示' }));
  fireEvent.press(screen.getByRole('switch', { name: '轮播自动播放' }));
  expect(
    screen.getByText('自动播放已因系统减少动态效果而停止')
  ).toBeOnTheScreen();
  expect(
    mockUpstreamCarouselProps.filter((props) => props.data !== undefined)
  ).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ autoplay: true })])
  );
});
