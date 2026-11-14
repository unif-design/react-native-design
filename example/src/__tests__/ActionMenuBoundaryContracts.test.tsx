import React from 'react';
import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import * as LiquidGlass from '@callstack/liquid-glass';
import { fireEvent, render } from '@testing-library/react-native';
import { SendOutlined } from '@unif/react-native-icons';
import {
  ActionMenuContent,
  Card,
  IconButton,
  ThemeProvider,
  lightShadow,
  darkShadow,
} from '@unif/react-native-design';

test.each(['dialog', 'sheet', 'popover'] as const)(
  '%s 菜单确认、取消、目标撤销与卡片点按保留调用方职责',
  (presentation) => {
    const events: string[] = [];
    const confirmation = {
      message: '这项内容将被删除',
      confirmLabel: '确认删除',
      title: '删除内容',
    };
    const remove = jest.fn(() => events.push('remove'));
    const save = jest.fn();
    const close = jest.fn(() => events.push('close'));
    const onConfirmationChange = jest.fn();
    const content = (withConfirmation: boolean) => (
      <ThemeProvider>
        <ActionMenuContent
          presentation={presentation}
          title="菜单"
          message="选择一项操作"
          pointer={{ edge: 'bottom', offset: 22 }}
          actions={[
            { id: 'save', label: '保存', onPress: save },
            {
              id: 'remove',
              label: '删除',
              onPress: remove,
              icon: SendOutlined,
              tone: 'danger',
              confirmation: withConfirmation ? confirmation : undefined,
            },
          ]}
          onClose={close}
          onConfirmationChange={onConfirmationChange}
          testID="menu"
        />
      </ThemeProvider>
    );
    const page = render(content(true));
    expect(page.getByText('选择一项操作')).toBeTruthy();
    expect(onConfirmationChange).toHaveBeenLastCalledWith(null);
    fireEvent.press(page.getByRole('button', { name: '保存' }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    fireEvent.press(page.getByRole('button', { name: '删除' }));
    expect(page.getByText('这项内容将被删除')).toBeTruthy();
    expect(page.getByText('删除内容')).toBeTruthy();
    expect(onConfirmationChange).toHaveBeenLastCalledWith('remove');
    fireEvent.press(page.getByRole('button', { name: '取消' }));
    expect(page.queryByText('这项内容将被删除')).toBeNull();
    expect(remove).not.toHaveBeenCalled();
    fireEvent.press(page.getByRole('button', { name: '删除' }));
    page.rerender(content(false));
    expect(page.queryByText('确认删除')).toBeNull();
    expect(onConfirmationChange).toHaveBeenLastCalledWith(null);
    page.rerender(content(true));
    fireEvent.press(page.getByRole('button', { name: '删除' }));
    fireEvent.press(page.getByRole('button', { name: '确认删除' }));
    expect(events).toEqual(['close', 'remove']);
    if (presentation !== 'popover') {
      const stopPropagation = jest.fn();
      fireEvent.press(page.getByTestId('menu-card'), { stopPropagation });
      expect(stopPropagation).toHaveBeenCalledTimes(1);
      expect(close).toHaveBeenCalledTimes(1);
      fireEvent.press(page.getByTestId('menu'));
      expect(close).toHaveBeenCalledTimes(2);
    }
  }
);

test.each(['dialog', 'sheet', 'popover'] as const)(
  '%s 隐藏取消按钮时保留默认标题与确认行为',
  (presentation) => {
    const close = jest.fn();
    const action = jest.fn();
    const page = render(
      <ThemeProvider>
        <ActionMenuContent
          presentation={presentation}
          cancelLabel={null}
          onClose={close}
          actions={[
            {
              id: 'run',
              label: '执行',
              onPress: action,
              confirmation: { message: '是否执行', confirmLabel: '确认执行' },
            },
          ]}
        />
      </ThemeProvider>
    );
    expect(page.queryByRole('button', { name: '取消' })).toBeNull();
    fireEvent.press(page.getByRole('button', { name: '执行' }));
    expect(page.queryByRole('button', { name: '取消' })).toBeNull();
    fireEvent.press(page.getByRole('button', { name: '确认执行' }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  }
);

test('没有名称的菜单项保留禁用语义，普通项通过真实按压执行', async () => {
  const { userEvent } =
    require('@testing-library/react-native') as typeof import('@testing-library/react-native');
  const {
    ActionMenuItem,
  } = require('../../../src/components/ui/ActionMenuContent/ActionMenuItem');
  const execute = jest.fn();
  const page = render(
    <ThemeProvider>
      <ActionMenuItem action={{ id: 'blank', label: ' ' }} onPress={execute} />
      <ActionMenuItem action={{ id: 'ok', label: '执行' }} onPress={execute} />
    </ThemeProvider>
  );
  expect(page.getAllByRole('button')).toHaveLength(1);
  await userEvent.press(page.getByRole('button', { name: '执行' }));
  expect(execute).toHaveBeenCalledTimes(1);
});

test('调用方动态撤回图标时菜单仍能交付动作', () => {
  const {
    ActionMenuItem,
  } = require('../../../src/components/ui/ActionMenuContent/ActionMenuItem');
  let reads = 0;
  const action = {
    id: 'changing-icon',
    label: '动态动作',
    get icon() {
      return reads++ === 0 ? SendOutlined : undefined;
    },
  };
  const execute = jest.fn();
  const page = render(
    <ThemeProvider>
      <ActionMenuItem action={action} onPress={execute} />
    </ThemeProvider>
  );
  fireEvent.press(page.getByRole('button', { name: '动态动作' }));
  expect(execute).toHaveBeenCalledTimes(1);
});

test.each([
  {
    platform: 'ios',
    supported: true,
    scheme: 'light',
    arrow: false,
    box: true,
  },
  {
    platform: 'ios',
    supported: true,
    scheme: 'dark',
    arrow: false,
    box: false,
  },
  {
    platform: 'ios',
    supported: true,
    scheme: 'light',
    arrow: true,
    box: true,
  },
  {
    platform: 'ios',
    supported: false,
    scheme: 'light',
    arrow: false,
    box: false,
  },
  {
    platform: 'android',
    supported: false,
    scheme: 'light',
    arrow: false,
    box: false,
  },
  {
    platform: 'web',
    supported: false,
    scheme: 'light',
    arrow: false,
    box: false,
  },
] as const)(
  '$platform/$scheme/玻璃=$supported/箭头=$arrow 菜单共用 card 阴影，实体回退保留原有单层阴影',
  ({ platform, supported, scheme, arrow, box }) => {
    const platformOverride = jest.replaceProperty(Platform, 'OS', platform);
    const supportOverride = jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      supported
    );
    const execute = jest.fn();
    const page = render(
      <ThemeProvider forceScheme={scheme}>
        <ActionMenuContent
          presentation="popover"
          testID="shadow-menu"
          onClose={jest.fn()}
          {...(arrow
            ? { pointer: { edge: 'bottom' as const, offset: 22 } }
            : {})}
          actions={[{ id: 'photos', label: '照片', onPress: execute }]}
        />
      </ThemeProvider>
    );
    try {
      const style = StyleSheet.flatten(
        page.getByTestId('shadow-menu').props.style
      );
      if (box) {
        expect(style.backgroundColor).toBe('transparent');
        expect(style.shadowOpacity).toBe(0);
        expect(style.boxShadow).toEqual([
          {
            offsetX: 0,
            offsetY: scheme === 'light' ? 1 : 0,
            blurRadius: scheme === 'light' ? 8 : 0,
            color: `rgba(0, 0, 0, ${scheme === 'light' ? 0.08 : 0})`,
          },
        ]);
      } else {
        expect(style.boxShadow ?? []).toEqual([]);
        expect(style.shadowOpacity).toBe(
          scheme === 'dark' ? 0 : supported || platform === 'web' ? 0.08 : 0.12
        );
      }
      fireEvent.press(page.getByRole('button', { name: '照片' }));
      expect(execute).toHaveBeenCalledTimes(1);
    } finally {
      page.unmount();
      supportOverride.restore();
      platformOverride.restore();
    }
  }
);

test.each(['ios', 'android', 'web'] as const)(
  '%s 普通卡片与玻璃按钮共用 card 阴影，透明按钮无需像素投影',
  (platform) => {
    const platformOverride = jest.replaceProperty(Platform, 'OS', platform);
    const page = render(
      <ThemeProvider forceScheme="light">
        <Card testID="shared-shadow-card">
          <IconButton
            testID="shared-shadow-button"
            icon={SendOutlined}
            accessibilityLabel="回到最新消息"
            onPress={jest.fn()}
            variant="glass"
            style={lightShadow.card}
          />
        </Card>
      </ThemeProvider>
    );
    try {
      const removed: ViewStyle = { ...lightShadow.card, ...lightShadow.none };
      expect(removed.shadowOpacity).toBe(0);
      expect(removed.boxShadow ?? []).toEqual([]);
      for (const id of ['shared-shadow-card', 'shared-shadow-button']) {
        const style = StyleSheet.flatten(page.getByTestId(id).props.style);
        if (platform === 'ios') {
          expect(style.shadowOpacity).toBe(0);
          expect(style.boxShadow).toEqual([
            {
              offsetX: 0,
              offsetY: 1,
              blurRadius: 8,
              color: 'rgba(0, 0, 0, 0.08)',
            },
          ]);
        } else {
          expect(style.shadowOpacity).toBe(0.08);
          expect(style.boxShadow ?? []).toEqual([]);
        }
      }
    } finally {
      page.unmount();
      platformOverride.restore();
    }
  }
);

test.each(['ios', 'android', 'web'] as const)(
  '%s 暗色 Card 采用 none 后保持无阴影及平台样式边界',
  (platform) => {
    const platformOverride = jest.replaceProperty(Platform, 'OS', platform);
    const page = render(
      <ThemeProvider forceScheme="dark">
        <Card testID="dark-none-card" style={darkShadow.none}>
          {null}
        </Card>
      </ThemeProvider>
    );
    try {
      const style = StyleSheet.flatten(
        page.getByTestId('dark-none-card').props.style
      );
      expect(style.shadowOpacity).toBe(0);
      if (platform === 'ios') expect(style.boxShadow).toEqual([]);
      else expect(style).not.toHaveProperty('boxShadow');
    } finally {
      page.unmount();
      platformOverride.restore();
    }
  }
);

test.each(['ios', 'android', 'web'] as const)(
  '%s 加载实体浮层时仅 iOS 清除 boxShadow，保留原有浮层阴影',
  (platform) => {
    jest.isolateModules(() => {
      const native = require('react-native') as typeof import('react-native');
      const platformOverride = jest.replaceProperty(
        native.Platform,
        'OS',
        platform
      );
      try {
        const {
          nativeFallbackStyles,
        } = require('../../../src/theme/nativeFallbackStyles');
        const style = native.StyleSheet.flatten(nativeFallbackStyles.floating);
        expect(style.backgroundColor).toBe('#FFFFFF');
        expect(style.shadowOpacity).toBe(0.12);
        if (platform === 'ios') expect(style.boxShadow).toEqual([]);
        else expect(style).not.toHaveProperty('boxShadow');
      } finally {
        platformOverride.restore();
      }
    });
  }
);
