import React from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import {
  Button,
  GlassLayer,
  darkColors,
  lightColors,
  NavBar,
  space,
  ThemeProvider,
} from '@unif/react-native-design';
import { Sheet } from '@unif/react-native-design';

const viewStyles = (page: Awaited<ReturnType<typeof render>>) =>
  page.UNSAFE_root.findAll((node) => String(node.type) === 'View').map((node) =>
    StyleSheet.flatten(node.props.style)
  );

test('默认固定内容并将 root 与内容样式应用到各自容器', async () => {
  const page = await render(
    <ThemeProvider>
      <Sheet
        testID="sheet"
        style={{ borderRadius: 17 }}
        contentContainerStyle={{ paddingLeft: 111 }}
      >
        <Text>固定内容</Text>
      </Sheet>
    </ThemeProvider>
  );

  expect(
    page.UNSAFE_root.findAll((node) => String(node.type) === 'RCTScrollView')
  ).toHaveLength(0);
  expect(
    StyleSheet.flatten(page.getByTestId('sheet').props.style)
  ).toMatchObject({
    flex: 1,
    borderRadius: 17,
  });
  expect(viewStyles(page)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        flex: 1,
        paddingHorizontal: space['9'],
        paddingTop: space['4'],
        paddingBottom: space['9'],
        gap: space['5'],
        paddingLeft: 111,
      }),
    ])
  );
});

test.each(['glass', 'transparent'] as const)(
  '标题材质 %s 保留悬浮布局和真实高度避让',
  async (headerSurface) => {
    const page = await render(
      <ThemeProvider>
        <Sheet
          testID="sheet"
          headerMode="overlay"
          headerSurface={headerSurface}
          contentMode="scroll"
          style={{ backgroundColor: lightColors.surfaceContainer }}
          header={<Text>浮动标题</Text>}
          contentContainerStyle={{ paddingTop: 7 }}
        >
          <Text>正文</Text>
        </Sheet>
      </ThemeProvider>
    );
    const header = page.UNSAFE_root.findAll(
      (node) =>
        String(node.type) === 'View' &&
        StyleSheet.flatten(node.props.style)?.zIndex === 1
    )[0];
    expect(StyleSheet.flatten(header.props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      zIndex: 1,
    });
    expect(header.props.pointerEvents).toBe('box-none');
    expect(page.UNSAFE_queryAllByType(GlassLayer)).toHaveLength(
      headerSurface === 'glass' ? 1 : 0
    );
    await fireEvent(header, 'layout', {
      nativeEvent: { layout: { height: 48, width: 320, x: 0, y: 0 } },
    });
    const scroll = page.UNSAFE_root.findAll(
      (node) => String(node.type) === 'RCTScrollView'
    )[0];
    expect(
      StyleSheet.flatten(scroll.props.contentContainerStyle).paddingTop
    ).toBe(55);
    expect(
      StyleSheet.flatten(scroll.props.style).backgroundColor
    ).toBeUndefined();
    expect(
      StyleSheet.flatten(page.getByTestId('sheet').props.style).backgroundColor
    ).toBe(lightColors.surfaceContainer);
    await fireEvent(header, 'layout', {
      nativeEvent: { layout: { height: 72, width: 320, x: 0, y: 0 } },
    });
    expect(
      StyleSheet.flatten(scroll.props.contentContainerStyle).paddingTop
    ).toBe(79);
  }
);

test('悬浮标题保留百分比顶部留白并跟随实际内容宽度', async () => {
  const page = await render(
    <ThemeProvider>
      <Sheet
        headerMode="overlay"
        contentMode="scroll"
        header={<Text>标题</Text>}
        contentContainerStyle={{ paddingTop: '10%' }}
      >
        <Text>正文</Text>
      </Sheet>
    </ThemeProvider>
  );
  const header = page.UNSAFE_root.findAll(
    (node) =>
      String(node.type) === 'View' &&
      StyleSheet.flatten(node.props.style)?.zIndex === 1
  )[0];
  const scroll = page.UNSAFE_root.findAll(
    (node) => String(node.type) === 'RCTScrollView'
  )[0];
  await fireEvent(header, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 48 } },
  });
  await fireEvent(scroll, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 480 } },
  });
  expect(
    StyleSheet.flatten(scroll.props.contentContainerStyle).paddingTop
  ).toBe(80);
  await fireEvent(scroll, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 640, height: 480 } },
  });
  expect(
    StyleSheet.flatten(scroll.props.contentContainerStyle).paddingTop
  ).toBe(112);
});

test('滚动模式只滚动中间内容并保留固定头尾', async () => {
  const page = await render(
    <ThemeProvider>
      <Sheet
        testID="sheet"
        contentMode="scroll"
        header={<NavBar testID="sheet-header" title="选择" />}
        footer={<Text>固定底部</Text>}
        contentContainerStyle={{ paddingRight: 113 }}
      >
        {Array.from({ length: 20 }, (_, index) => (
          <Text key={index}>候选内容 {index + 1}</Text>
        ))}
      </Sheet>
    </ThemeProvider>
  );
  const scrollView = page.UNSAFE_root.findAll(
    (node) => String(node.type) === 'RCTScrollView'
  )[0];

  expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
  expect(StyleSheet.flatten(scrollView.props.style)).toMatchObject({ flex: 1 });
  expect(
    StyleSheet.flatten(scrollView.props.contentContainerStyle)
  ).toMatchObject({
    paddingHorizontal: space['9'],
    paddingTop: space['4'],
    paddingBottom: space['9'],
    gap: space['5'],
    paddingRight: 113,
  });
  expect(
    scrollView.findAll((node) => node.props.children === '选择')
  ).toHaveLength(0);
  expect(
    scrollView.findAll((node) => node.props.children === '固定底部')
  ).toHaveLength(0);
  const lastItem = page.getByText('候选内容 20');
  expect(scrollView.findAll((node) => node === lastItem)).toHaveLength(1);
});

test('外部滚动模式不在实际列表外再嵌套纵向 ScrollView', async () => {
  const page = await render(
    <ThemeProvider>
      <Sheet contentMode="external-scroll">
        <FlatList
          data={['甲', '乙']}
          keyExtractor={(item) => item}
          renderItem={({ item }) => <Text>{item}</Text>}
        />
      </Sheet>
    </ThemeProvider>
  );

  expect(page.getByText('甲')).toBeTruthy();
  expect(
    page.UNSAFE_root.findAll((node) => String(node.type) === 'RCTScrollView')
  ).toHaveLength(1);
});

test('没有 header 时显示非交互 grabber，玻璃 footer 保留基础间距', async () => {
  const page = await render(
    <ThemeProvider>
      <Sheet footer={<Text>底部操作</Text>}>
        <Text>内容</Text>
      </Sheet>
    </ThemeProvider>
  );
  const styles = viewStyles(page);

  expect(page.queryAllByRole('button')).toHaveLength(0);
  expect(styles).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        paddingTop: space['3'],
        paddingBottom: space['2'],
        alignItems: 'center',
      }),
      expect.objectContaining({
        width: 36,
        height: 5,
        borderRadius: 3,
        backgroundColor: lightColors.foregroundMuted,
      }),
      expect.objectContaining({
        backgroundColor: 'transparent',
        paddingHorizontal: space['9'],
        paddingTop: space['5'],
        paddingBottom: space['6'],
        borderTopWidth: 0,
        borderTopColor: lightColors.outline,
      }),
    ])
  );
  const footerStyle = styles.find(
    (style) => style?.borderTopColor === lightColors.outline
  );
  expect(footerStyle?.height).toBeUndefined();
});

test('真实 Design 头尾动作各由调用方触发一次，卸载不生成额外事件', async () => {
  const onBack = jest.fn();
  const onConfirm = jest.fn();
  const page = await render(
    <ThemeProvider>
      <Sheet
        header={
          <NavBar
            title="选择"
            left={<Button label="返回" onPress={onBack} />}
          />
        }
        footer={<Button label="确认" onPress={onConfirm} />}
      >
        <Text>候选内容</Text>
      </Sheet>
    </ThemeProvider>
  );

  await fireEvent.press(page.getByRole('button', { name: '确认' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onBack).not.toHaveBeenCalled();
  await fireEvent.press(page.getByRole('button', { name: '返回' }));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledTimes(1);
  await page.unmount();
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

test('主题和字体设置透传给 Sheet 样式与调用方组合的 Design 内容', async () => {
  const content = (theme: 'light' | 'dark', fontScale: number) => (
    <ThemeProvider forceScheme={theme} fontScale={fontScale}>
      <Sheet
        testID="sheet"
        footer={<Button label="确认" onPress={jest.fn()} />}
      >
        <Text>内容</Text>
      </Sheet>
    </ThemeProvider>
  );
  const page = await render(content('light', 1));
  const lightFontSize = StyleSheet.flatten(
    page.getByText('确认').props.style
  ).fontSize;

  expect(viewStyles(page)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        flex: 1,
        backgroundColor: lightColors.surface,
      }),
    ])
  );
  await page.rerender(content('dark', 1.5));
  expect(viewStyles(page)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ flex: 1, backgroundColor: darkColors.surface }),
    ])
  );
  expect(viewStyles(page)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        width: 36,
        height: 5,
        backgroundColor: darkColors.foregroundMuted,
      }),
    ])
  );
  expect(StyleSheet.flatten(page.getByText('确认').props.style).fontSize).toBe(
    lightFontSize * 1.5
  );
});

test.each(['text', 'navbar'] as const)(
  '自定义 %s header 保留主题内容底，页脚材质独立',
  (kind) => {
    const header =
      kind === 'text' ? (
        <Text testID="custom-title">项目标题</Text>
      ) : (
        <NavBar title="项目标题" testID="custom-title" />
      );
    const page = render(
      <ThemeProvider>
        <Sheet header={header} footer={<Text>工具区</Text>}>
          <Text>正文</Text>
        </Sheet>
      </ThemeProvider>
    );
    let node = page.getByTestId('custom-title').parent;
    while (
      node &&
      StyleSheet.flatten(node.props.style)?.backgroundColor !==
        lightColors.surface
    )
      node = node.parent;
    expect(node).not.toBeNull();
    let footer = page.getByText('工具区').parent;
    while (
      footer &&
      StyleSheet.flatten(footer.props.style)?.borderTopColor !==
        lightColors.outline
    )
      footer = footer.parent;
    expect(StyleSheet.flatten(footer?.props.style).backgroundColor).toBe(
      'transparent'
    );
  }
);
