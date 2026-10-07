const mockCarouselProps = jest.fn<
  void,
  [React.ComponentProps<typeof Carousel>]
>();
// 只观察公开交接参数，原组件仍完整渲染。
jest.mock('react-native-reanimated-carousel', () => {
  const actual = jest.requireActual<
    typeof import('react-native-reanimated-carousel')
  >('react-native-reanimated-carousel');
  return {
    ...actual,
    __esModule: true,
    Carousel: (props: React.ComponentProps<typeof Carousel>) => {
      mockCarouselProps(props);
      return require('react').createElement(actual.Carousel, props);
    },
  };
});
const mockThumbnailProps = jest.fn<
  void,
  [React.ComponentProps<typeof Thumbnail>]
>();
jest.mock('../../../src/components/ui/Thumbnail', () => {
  const actual = jest.requireActual<typeof import('@unif/react-native-design')>(
    '../../../src/components/ui/Thumbnail'
  );
  return {
    ...actual,
    Thumbnail: (props: React.ComponentProps<typeof Thumbnail>) => {
      mockThumbnailProps(props);
      return require('react').createElement(actual.Thumbnail, props);
    },
  };
});
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import {
  control,
  darkColors,
  lightColors,
  ThemeProvider,
  Thumbnail,
} from '@unif/react-native-design';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Carousel } from 'react-native-reanimated-carousel';
import type { CarouselRef } from 'react-native-reanimated-carousel';
import { ImagePreview } from '@unif/react-native-design';
import type {
  ImagePreviewHandle,
  ImagePreviewItem,
  ImagePreviewProps,
} from '@unif/react-native-design';

let mockDeferAnimation = false;
const mockNativeValues: Array<{ value: unknown }> = [];
const mockAnimationFinishes: Array<() => void> = [];
const mockRNQueue: Array<() => void> = [];
jest.mock('react-native-reanimated', () => {
  const ReactActual = require('react');
  const boundary = require('react-native-reanimated/mock');
  return {
    ...boundary,
    useSharedValue: (value: unknown) => {
      const ref = ReactActual.useRef();
      if (ref.current === undefined) {
        ref.current = boundary.useSharedValue(value);
        mockNativeValues.push(ref.current);
      }
      return ref.current;
    },
    makeMutable: (value: unknown) => boundary.useSharedValue(value),
    withTiming: (
      value: unknown,
      config: unknown,
      callback?: (finished: boolean) => void
    ) => {
      if (mockDeferAnimation && callback)
        mockAnimationFinishes.push(() => callback(true));
      else callback?.(true);
      return value;
    },
  };
});

afterEach(() => {
  mockDeferAnimation = false;
  mockAnimationFinishes.length = 0;
  mockRNQueue.length = 0;
  mockNativeValues.length = 0;
});

const items: readonly ImagePreviewItem[] = [
  {
    id: 'a',
    source: { uri: 'https://example.invalid/same.png' },
    label: '第一张',
  },
  {
    id: 'b',
    source: { uri: 'https://example.invalid/same.png' },
    canDelete: true,
  },
  { id: 'c', canDelete: true },
];

async function mount(props: Partial<ImagePreviewProps> = {}, strict = false) {
  const ref = React.createRef<ImagePreviewHandle>();
  const onCurrentChange = jest.fn();
  const onRequestDelete = jest.fn();
  const content = (
    next: Partial<ImagePreviewProps>,
    dark = false,
    scale = 1
  ) => {
    const node = (
      <ThemeProvider forceScheme={dark ? 'dark' : 'light'} fontScale={scale}>
        <GestureHandlerRootView>
          <ImagePreview
            ref={ref}
            items={items}
            width={300}
            height={400}
            testID="preview"
            onCurrentChange={onCurrentChange}
            onRequestDelete={onRequestDelete}
            {...next}
          />
        </GestureHandlerRootView>
      </ThemeProvider>
    );
    return strict ? <React.StrictMode>{node}</React.StrictMode> : node;
  };
  const page = await render(content(props));
  return {
    ...page,
    ref,
    onCurrentChange,
    onRequestDelete,
    update: async (next: Partial<ImagePreviewProps>, dark = false, scale = 1) =>
      await page.rerender(content({ ...props, ...next }, dark, scale)),
    sdk: () => page.getByTestId('preview-carousel'),
    sdkRef: () =>
      (mockCarouselProps.mock.lastCall![0].ref as React.RefObject<CarouselRef>)
        .current,
  };
}

test.each(['b', 'unknown', undefined])(
  '首次按有效 initialId=%s 定位，同 URI 身份独立',
  async (initialId) => {
    const page = await mount({ initialId });
    const expected = initialId === 'b' ? items[1] : items[0];
    expect(page.ref.current?.getCurrent()).toBe(expected);
    expect(page.onCurrentChange).toHaveBeenCalledTimes(1);
    expect(page.onCurrentChange).toHaveBeenLastCalledWith(expected);
    expect(page.sdkRef().getCurrentIndex()).toBe(initialId === 'b' ? 1 : 0);
    expect(
      page.getAllByRole('image', { includeHiddenElements: true })
    ).toHaveLength(2);
  }
);

test('初始空、首次非空、变空和再加入均有正确通知与 ref', async () => {
  const page = await mount({ items: [], initialId: 'b' });
  expect(page.ref.current?.getCurrent()).toBeUndefined();
  expect(page.queryByTestId('preview')).toBeNull();
  expect(page.onCurrentChange).not.toHaveBeenCalled();
  await page.update({ items });
  expect(page.ref.current?.getCurrent()).toBe(items[1]);
  await page.update({ items: [] });
  expect(page.ref.current?.getCurrent()).toBeUndefined();
  await page.update({ items: [items[1]] });
  expect(page.onCurrentChange.mock.calls.map(([item]) => item.id)).toEqual([
    'b',
    'b',
  ]);
});

test('真实公开 ref 非动画切页，未知 id 不改变，普通渲染不重复通知', async () => {
  const page = await mount();
  expect(page.getByLabelText('第1张，共3张')).toBeTruthy();
  await act(() => page.ref.current?.scrollTo('b', false));
  expect(page.ref.current?.getCurrent()).toBe(items[1]);
  expect(page.sdkRef().getCurrentIndex()).toBe(1);
  expect(page.getByText('第2/3张')).toBeTruthy();
  expect(page.getByLabelText('第2张，共3张')).toBeTruthy();
  await act(() => page.ref.current?.scrollTo('unknown'));
  await page.update({ items: [...items], initialId: 'c' });
  expect(page.onCurrentChange.mock.calls.map(([item]) => item.id)).toEqual([
    'a',
    'b',
  ]);
});

test('追加、前插、重排保持当前 id，当前移除取原位置后继/末项前项', async () => {
  const page = await mount({ initialId: 'b' });
  const d = { id: 'd' };
  await page.update({ items: [...items, d] });
  expect(page.ref.current?.getCurrent()?.id).toBe('b');
  await page.update({ items: [d, ...items] });
  expect(page.ref.current?.getCurrent()?.id).toBe('b');
  expect(page.sdkRef().getCurrentIndex()).toBe(2);
  await page.update({ items: [items[2], items[1], items[0], d] });
  expect(page.sdkRef().getCurrentIndex()).toBe(1);
  await page.update({ items: [items[2], items[0], d] });
  expect(page.ref.current?.getCurrent()?.id).toBe('a');
  await act(() => page.ref.current?.scrollTo('d', false));
  await page.update({ items: [items[2], items[0]] });
  expect(page.ref.current?.getCurrent()?.id).toBe('a');
  expect(page.sdkRef().getCurrentIndex()).toBe(1);
  expect(page.onCurrentChange.mock.calls.map(([item]) => item.id)).toEqual([
    'b',
    'a',
    'd',
    'a',
  ]);
});

test('同 id 对象更新读取最新原对象但不重发通知', async () => {
  const page = await mount({ initialId: 'b' });
  const updated = { ...items[1], deleting: true };
  await page.update({ items: [items[0], updated, items[2]] });
  expect(page.ref.current?.getCurrent()).toBe(updated);
  expect(page.onCurrentChange).toHaveBeenCalledTimes(1);
  expect(page.getByRole('button', { name: '删除当前照片' })).toBeDisabled();
});

test('不可删除或缺少 handler 隐藏，deleting 禁用，按压捕获原项一次', async () => {
  const page = await mount();
  expect(page.queryByRole('button', { name: '删除当前照片' })).toBeNull();
  await act(() => page.ref.current?.scrollTo('b', false));
  await fireEvent.press(page.getByRole('button', { name: '删除当前照片' }));
  expect(page.onRequestDelete).toHaveBeenCalledTimes(1);
  expect(page.onRequestDelete).toHaveBeenCalledWith(items[1]);
  expect(page.ref.current?.getCurrent()).toBe(items[1]);
  await act(() => page.ref.current?.scrollTo('c', false));
  await page.update({ items: [{ ...items[2], deleting: true }] });
  await fireEvent.press(page.getByRole('button', { name: '删除当前照片' }));
  expect(page.onRequestDelete).toHaveBeenCalledTimes(1);
  expect(page.onRequestDelete.mock.calls[0][0]).toBe(items[1]);
  await page.update({ items: [items[2]], onRequestDelete: undefined });
  expect(page.queryByRole('button', { name: '删除当前照片' })).toBeNull();
});

test('缺图与加载失败保留序号/删除目标，旧图片错误不污染换图', async () => {
  const page = await mount({ initialId: 'b' });
  const image = page.UNSAFE_root.findAll(
    (node) => String(node.type) === 'Image'
  )[1];
  const oldError = image.props.onError;
  await fireEvent(image, 'error', {
    nativeEvent: { error: 'fixture failure' },
  });
  expect(page.getAllByText('图片暂不可预览').length).toBeGreaterThan(0);
  expect(page.ref.current?.getCurrent()).toBe(items[1]);
  expect(page.getByText('第2/3张')).toBeTruthy();
  await fireEvent.press(page.getByRole('button', { name: '删除当前照片' }));
  expect(page.onRequestDelete).toHaveBeenLastCalledWith(items[1]);
  const replacement = {
    ...items[1],
    source: { uri: 'https://example.invalid/new.png' },
  };
  await page.update({ items: [items[0], replacement, items[2]] });
  await act(() => oldError({ nativeEvent: { error: 'late failure' } }));
  expect(
    page.UNSAFE_root.findAll((node) => String(node.type) === 'Image').some(
      (node) => node.props.source.uri.endsWith('/new.png')
    )
  ).toBe(true);
  await act(() => page.ref.current?.scrollTo('c', false));
  await fireEvent.press(page.getByRole('button', { name: '删除当前照片' }));
  expect(page.onRequestDelete).toHaveBeenCalledWith(items[2]);
  expect(page.getByText('第3/3张')).toBeTruthy();
});

test('媒体尺寸 contain、主题/大字仅缩放文字，序号与操作在裁切外', async () => {
  const page = await mount({ initialId: 'b', style: { paddingTop: 7 } });
  const thumbnail = page.getAllByRole('image', {
    includeHiddenElements: true,
  })[0];
  expect(thumbnail.props.resizeMode).toBe('contain');
  const mediaFrame = page.UNSAFE_root.findAll(
    (node) => String(node.type) === 'View'
  )
    .map((node) => StyleSheet.flatten(node.props.style))
    .find(
      (style) =>
        style?.width === 300 &&
        style?.height === 400 &&
        style?.backgroundColor === 'black'
    );
  expect(mediaFrame).toMatchObject({
    width: 300,
    height: 400,
    backgroundColor: 'black',
  });
  expect(mediaFrame?.borderWidth).toBeUndefined();
  expect(
    page
      .sdk()
      .findAll((node) => String(node.type) === 'Text')
      .some((node) => node.props.children === '第2/3张')
  ).toBe(false);
  expect(
    page.sdk().findAll((node) => node.props.accessibilityRole === 'button')
  ).toHaveLength(0);
  const counter = page.getByText('第2/3张');
  const baseline = StyleSheet.flatten(counter.props.style);
  expect(baseline.color).toBe(lightColors.foreground);
  expect(
    StyleSheet.flatten(counter.parent?.props.style).height
  ).toBeUndefined();
  expect(page.getByRole('button', { name: '删除当前照片' })).toHaveStyle({
    backgroundColor: 'transparent',
    height: control.sm,
    width: control.sm,
  });
  expect(
    StyleSheet.flatten(page.getByTestId('preview').props.style).paddingTop
  ).toBe(7);
  await page.update({}, true, 1.5);
  expect(
    StyleSheet.flatten(page.getByText('第2/3张').props.style)
  ).toMatchObject({
    color: darkColors.foreground,
    fontSize: baseline.fontSize * 1.5,
  });
  expect(
    page.UNSAFE_root.findAll((node) => String(node.type) === 'View').map(
      (node) => StyleSheet.flatten(node.props.style)
    )
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        width: 300,
        height: 400,
        backgroundColor: 'black',
      }),
    ])
  );
  expect(
    page.UNSAFE_root.findAll((node) => String(node.type) === 'Text').some(
      (node) => node.props.allowFontScaling === false
    )
  ).toBe(false);
  const root = page.getByTestId('preview');
  expect(
    root
      .findAll((node) => String(node.type) === 'View')
      .some(
        (node) => StyleSheet.flatten(node.props.style)?.overflow === 'hidden'
      )
  ).toBe(true);
});

test('严格模式挂载仅通知一次，真实卸载后保留句柄不再读取或定位', async () => {
  const page = await mount({}, true);
  expect(page.onCurrentChange).toHaveBeenCalledTimes(1);
  const handle = page.ref.current!;
  await page.unmount();
  expect(handle.getCurrent()).toBeUndefined();
  await act(() => handle.scrollTo('b', false));
  expect(page.onCurrentChange).toHaveBeenCalledTimes(1);
});

// 只延迟 Reanimated 的完成边界；Carousel 的控制器、数据协调与 ref 均为真实实现。
function deferAnimation() {
  mockDeferAnimation = true;
  return {
    finish: async () =>
      await act(async () => {
        mockAnimationFinishes.shift()?.();
      }),
  };
}

// 使用真实 Worklets mock 的 queueMicrotask 投递，只控制 RN 队列的交付时机。
function queueAnimationFinish() {
  const queue = jest
    .spyOn(global, 'queueMicrotask')
    .mockImplementation((callback) => {
      mockRNQueue.push(callback);
    });
  try {
    mockAnimationFinishes.shift()?.();
  } finally {
    queue.mockRestore();
  }
}

test('默认 animated=true，真实 SDK 在完成前保持原当前项，完成后才通知', async () => {
  const animation = deferAnimation();
  const page = await mount();
  await act(async () => page.ref.current?.scrollTo('b'));
  expect(mockAnimationFinishes).toHaveLength(1);
  expect(page.sdkRef().getCurrentIndex()).toBe(0);
  expect(page.ref.current?.getCurrent()).toBe(items[0]);
  expect(page.onCurrentChange).toHaveBeenCalledTimes(1);
  await animation.finish();
  expect(page.sdkRef().getCurrentIndex()).toBe(1);
  expect(page.ref.current?.getCurrent()).toBe(items[1]);
  expect(page.onCurrentChange).toHaveBeenCalledTimes(2);
});

test('动画中重排保留原已完成项，旧完成不得按旧 index 选择新集合', async () => {
  const animation = deferAnimation();
  const page = await mount();
  await act(async () => page.ref.current?.scrollTo('b'));
  await page.update({ items: [items[2], items[0], items[1]] });
  expect(page.ref.current?.getCurrent()).toBe(items[0]);
  await animation.finish();
  expect(page.ref.current?.getCurrent()).toBe(items[0]);
  expect(page.sdkRef().getCurrentIndex()).toBe(1);
  expect(page.onCurrentChange).toHaveBeenCalledTimes(1);
});

test.each([false, true])(
  '真实 SDK 非动画 scrollTo 无法收敛在途旧完成（重排=%s）',
  async (reorder) => {
    deferAnimation();
    const sdkRef = React.createRef<CarouselRef>();
    const snapped = jest.fn();
    const node = (data: ImagePreviewItem[]) => (
      <GestureHandlerRootView>
        <Carousel
          ref={sdkRef}
          data={data}
          defaultIndex={0}
          itemSize={300}
          style={{ width: 300, height: 400 }}
          keyExtractor={(item) => item.id}
          renderItem={() => <View />}
          onSnapToItem={snapped}
        />
      </GestureHandlerRootView>
    );
    const page = await render(node([...items]));
    await act(async () =>
      sdkRef.current?.scrollTo({ index: 1, animated: true })
    );
    // UI 动画已报告 finished=true，只把真实 SDK 的 RN 完成投递留在队列。
    queueAnimationFinish();
    expect(mockRNQueue).toHaveLength(1);
    expect(sdkRef.current?.getCurrentIndex()).toBe(0);
    if (reorder) await page.rerender(node([items[2], items[1], items[0]]));
    const target = reorder ? 2 : 0;
    await act(async () =>
      sdkRef.current?.scrollTo({ index: target, animated: false })
    );
    // 有待协调数据时，SDK 完成后的 effect 已把目标 2 覆盖成 1。
    expect(sdkRef.current?.getCurrentIndex()).toBe(reorder ? 1 : 0);
    await act(async () => {
      mockRNQueue.shift()?.();
    });
    expect(sdkRef.current?.getCurrentIndex()).toBe(1);
    expect(snapped.mock.calls.map(([index]) => index)).toEqual([target, 1]);
  }
);

test('动画中同 id 内容更新不重建，完成交付最新对象；普通 render 不打断动画', async () => {
  const animation = deferAnimation();
  const page = await mount();
  const sdk = page.sdkRef();
  await act(async () => page.ref.current?.scrollTo('b'));
  const updated = { ...items[1], label: '更新的说明' };
  await page.update({ items: [items[0], updated, items[2]] });
  expect(page.sdkRef().getCurrentIndex).toBe(sdk.getCurrentIndex);
  await page.update({ items: [items[0], updated, items[2]] });
  expect(page.ref.current?.getCurrent()).toBe(items[0]);
  await animation.finish();
  expect(page.ref.current?.getCurrent()).toBe(updated);
  expect(page.onCurrentChange.mock.calls.map(([item]) => item.id)).toEqual([
    'a',
    'b',
  ]);
});

test.each(
  [
    [items[2], items[0], items[1]],
    [{ id: 'new' }, ...items],
    [items[1], items[2]],
    [items[0]],
  ].map((nextItems) => ({ nextItems }))
)('动画中集合变化保持已完成身份或其原位置后继 %j', async ({ nextItems }) => {
  const animation = deferAnimation();
  const page = await mount();
  const oldSdk = page.sdkRef();
  await act(async () => page.ref.current?.scrollTo('b'));
  await page.update({ items: nextItems });
  expect(page.sdkRef().getCurrentIndex).not.toBe(oldSdk.getCurrentIndex);
  const expected = nextItems.find((item) => item.id === 'a') ?? nextItems[0];
  expect(page.ref.current?.getCurrent()).toBe(expected);
  expect(page.sdkRef().getCurrentIndex()).toBe(nextItems.indexOf(expected));
  await animation.finish();
  expect(page.ref.current?.getCurrent()).toBe(expected);
  expect(page.sdkRef().getCurrentIndex()).toBe(nextItems.indexOf(expected));
});

test('动画中空集合并再次加入，旧完成不选择新实例', async () => {
  const animation = deferAnimation();
  const page = await mount();
  await act(async () => page.ref.current?.scrollTo('b'));
  await page.update({ items: [] });
  expect(page.ref.current?.getCurrent()).toBeUndefined();
  await page.update({ items: [items[2], items[1]] });
  await animation.finish();
  expect(page.ref.current?.getCurrent()).toBe(items[2]);
  expect(page.onCurrentChange.mock.calls.map(([item]) => item.id)).toEqual([
    'a',
    'c',
  ]);
});

test('非动画定位返回后 getCurrent 同步读取已完成项', async () => {
  const page = await mount();
  await act(() => {
    page.ref.current?.scrollTo('b', false);
    expect(page.sdkRef().getCurrentIndex()).toBe(1);
    expect(page.ref.current?.getCurrent()).toBe(items[1]);
  });
});

test('只有缺图项时不创建图片加载请求，序号和删除仍可用', async () => {
  const page = await mount({ items: [items[2]] });
  expect(
    page.UNSAFE_root.findAll((node) => String(node.type) === 'Image')
  ).toHaveLength(0);
  expect(
    page.queryAllByRole('image', { includeHiddenElements: true })
  ).toHaveLength(0);
  expect(page.getByText('图片暂不可预览')).toBeTruthy();
  expect(page.getByText('第1/1张')).toBeTruthy();
  await fireEvent.press(page.getByRole('button', { name: '删除当前照片' }));
  expect(page.onRequestDelete).toHaveBeenCalledWith(items[2]);
});

test('已完成 UI 动画的旧 RN 投递在新集合中失效', async () => {
  deferAnimation();
  const page = await mount();
  await act(async () => page.ref.current?.scrollTo('b'));
  queueAnimationFinish();
  expect(mockRNQueue).toHaveLength(1);
  await page.update({ items: [items[2], items[0], items[1]] });
  await act(async () => {
    mockRNQueue.shift()?.();
  });
  expect(page.ref.current?.getCurrent()).toBe(items[0]);
  expect(page.sdkRef().getCurrentIndex()).toBe(1);
  expect(page.onCurrentChange).toHaveBeenCalledTimes(1);
});

test.each([false, true])(
  '连续 ref 命令 animated=%s 隔离前一条已排队完成',
  async (animated) => {
    const animation = deferAnimation();
    const page = await mount();
    await act(async () => page.ref.current?.scrollTo('b'));
    queueAnimationFinish();
    expect(mockRNQueue).toHaveLength(1);
    await act(async () => page.ref.current?.scrollTo('c', animated));
    expect(page.ref.current?.getCurrent()).toBe(animated ? items[0] : items[2]);
    await act(async () => {
      mockRNQueue.shift()?.();
    });
    expect(page.ref.current?.getCurrent()).toBe(animated ? items[0] : items[2]);
    if (animated) await animation.finish();
    expect(page.ref.current?.getCurrent()).toBe(items[2]);
    expect(page.sdkRef().getCurrentIndex()).toBe(2);
    expect(page.onCurrentChange.mock.calls.map(([item]) => item.id)).toEqual([
      'a',
      'c',
    ]);
  }
);

test.each(['reorder', 'remove', 'empty'])(
  '待交接命令遇到集合 %s 按当前 id 定位且不复活失效目标',
  async (change) => {
    deferAnimation();
    const page = await mount();
    await act(async () => page.ref.current?.scrollTo('b'));
    const next =
      change === 'reorder'
        ? [items[2], items[0], items[1]]
        : change === 'remove'
          ? [items[0], items[1]]
          : [];
    await act(async () => {
      page.ref.current?.scrollTo('c', false);
      await page.update({ items: next });
    });
    expect(page.ref.current?.getCurrent()).toBe(
      change === 'reorder'
        ? items[2]
        : change === 'remove'
          ? items[0]
          : undefined
    );
    await page.update({ items });
    expect(page.ref.current?.getCurrent()).toBe(
      change === 'reorder' ? items[2] : items[0]
    );
    expect(page.sdkRef().getCurrentIndex()).toBe(change === 'reorder' ? 2 : 0);
  }
);

test('待挂载期间多条命令交接最后的有效 id，未知 id 不覆盖它', async () => {
  deferAnimation();
  const page = await mount();
  await act(async () => page.ref.current?.scrollTo('b'));
  await act(async () => {
    page.ref.current?.scrollTo('c', true);
    page.ref.current?.scrollTo('b', false);
    page.ref.current?.scrollTo('unknown', false);
  });
  expect(page.ref.current?.getCurrent()).toBe(items[1]);
  expect(page.onCurrentChange.mock.calls.map(([item]) => item.id)).toEqual([
    'a',
    'b',
  ]);
});

test('同一轮连续非动画完成各交付一次当前身份，普通提交不重发', async () => {
  const page = await mount();
  await act(() => {
    page.ref.current?.scrollTo('b', false);
    page.ref.current?.scrollTo('c', false);
  });
  expect(page.onCurrentChange.mock.calls.map(([item]) => item.id)).toEqual([
    'a',
    'b',
    'c',
  ]);
  await page.update({ items: [...items] });
  expect(page.onCurrentChange).toHaveBeenCalledTimes(3);
});

test('动画中间帧同 id 内容更新不改变 SDK 落位，交付最新原项', async () => {
  const animation = deferAnimation();
  const page = await mount();
  const sdk = page.sdkRef();
  await act(async () => page.ref.current?.scrollTo('b'));
  const offsets = mockNativeValues.filter((value) => value.value === -300);
  expect(offsets).toHaveLength(1);
  const offset = offsets[0];
  offset.value = -30;
  const updated = {
    ...items[1],
    label: '新说明',
    source: { uri: 'https://example.invalid/new.png' },
    deleting: true,
  };
  await page.update({ items: [items[0], updated, items[2]] });
  expect(page.sdkRef().getCurrentIndex).toBe(sdk.getCurrentIndex);
  expect(page.ref.current?.getCurrent()).toBe(items[0]);
  const thumbnail = page.getAllByRole('image', {
    includeHiddenElements: true,
  })[1];
  const handoff = mockThumbnailProps.mock.calls
    .map(([props]) => props)
    .filter((props) => props.accessibilityLabel === '新说明')
    .at(-1);
  expect(handoff!.source).toBe(updated.source);
  expect(thumbnail.props.source).toEqual(updated.source);
  expect(thumbnail.props.accessibilityLabel).toBe('新说明');
  offset.value = -300;
  await animation.finish();
  expect(page.sdkRef().getCurrentIndex()).toBe(1);
  expect(offset.value).toBe(-300);
  expect(page.ref.current?.getCurrent()).toBe(updated);
  expect(page.onCurrentChange.mock.calls.map(([item]) => item.id)).toEqual([
    'a',
    'b',
  ]);
  expect(page.onCurrentChange).toHaveBeenLastCalledWith(updated);
  expect(page.getByRole('button', { name: '删除当前照片' })).toBeDisabled();
  await fireEvent.press(page.getByRole('button', { name: '删除当前照片' }));
  expect(page.onRequestDelete).not.toHaveBeenCalled();
  const deletable = { ...updated, deleting: false };
  await page.update({ items: [items[0], deletable, items[2]] });
  await fireEvent.press(page.getByRole('button', { name: '删除当前照片' }));
  expect(page.onRequestDelete).toHaveBeenCalledWith(deletable);
});

test('待交接定位同时移除原当前项，通知不倒退且与实时 ref 一致', async () => {
  deferAnimation();
  const observed: Array<{ event: string; current?: string }> = [];
  let handle: ImagePreviewHandle | null = null;
  const page = await mount({
    onCurrentChange: (item) =>
      observed.push({ event: item.id, current: handle?.getCurrent()?.id }),
  });
  handle = page.ref.current;
  await act(async () => page.ref.current?.scrollTo('b'));
  await act(async () => {
    page.ref.current?.scrollTo('c', false);
    await page.update({ items: [items[1], items[2]] });
  });
  expect(page.ref.current?.getCurrent()).toBe(items[2]);
  expect(page.sdkRef().getCurrentIndex()).toBe(1);
  expect(observed.slice(1)).toEqual([{ event: 'c', current: 'c' }]);
  await page.update({ items: [items[1], items[2]] });
  expect(observed.map((row) => row.event)).toEqual(['a', 'c']);
});
