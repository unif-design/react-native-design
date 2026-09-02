import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import type { ReactElement, ReactNode } from 'react';

type ElementProps = {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  children?: ReactNode;
  hitSlop?: unknown;
  label?: string;
  onPress?: () => void;
  shape?: string;
  size?: string;
  source?: unknown;
  style?: unknown;
  testID?: string;
  variant?: string;
};

function childrenOf(
  element: ReactElement<ElementProps>
): ReactElement<ElementProps>[] {
  const React = jest.requireActual<typeof import('react')>('react');
  return React.Children.toArray(
    element.props.children
  ) as ReactElement<ElementProps>[];
}

function isAvatarElement(element: ReactElement<ElementProps>): boolean {
  return typeof element.type === 'function' && element.type.name === 'Avatar';
}

function loadAvatarGroup() {
  const actualReact = jest.requireActual<typeof import('react')>('react');
  const warn = jest.fn();
  jest.doMock('react', () => ({
    ...actualReact,
    useEffect(effect: () => void) {
      effect();
    },
  }));
  jest.doMock('react-native', () => ({
    StyleSheet: { create: (styles: object) => styles },
    Text: 'Text',
    View: 'View',
  }));
  jest.doMock('react-native-gesture-handler', () => ({
    Pressable: 'Pressable',
  }));
  jest.doMock('../../../../src/theme', () => ({
    avatar: { xs: 18, sm: 28, md: 32, lg: 40, xl: 56 },
    fixed: { hitTarget: 44 },
    fw: { semi: '600' },
    pressedOpacity: 0.7,
    r: (value: number) => value,
    radius: { xs: 4, sm: 6, md: 8 },
    rf: (value: number) => value,
    scaleFontMetric: (value: number) => value,
    space: { '1': 4, '2': 6, '3': 8, '4': 10, '6': 14 },
    useColors: () => ({
      primary: 'overflow-fg',
      primaryContainer: 'overflow-bg',
      surface: 'surface',
    }),
    useFontScale: () => 1,
    useThemedStyles: () => ({
      root: 'root',
      overflow: 'overflow',
      overflowText: 'overflowText',
    }),
  }));
  jest.doMock('../../../../src/utils/logger', () => ({
    createLogger: () => ({ warn }),
  }));

  return {
    AvatarGroup:
      require('../../../../src/components/ui/AvatarGroup/AvatarGroup')
        .AvatarGroup as typeof import('../../../../src/components/ui/AvatarGroup/AvatarGroup').AvatarGroup,
    warn,
  };
}

const items = [
  { key: 'a', label: '甲', variant: 'brand' as const },
  { key: 'b', label: '乙', variant: 'info' as const },
  { key: 'c', label: '丙', variant: 'soft' as const },
  { key: 'd', label: '丁', variant: 'neutral' as const },
  { key: 'e', label: '戊' },
  { key: 'f', label: '己' },
  { key: 'g', label: '庚' },
];

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.dontMock('react');
  jest.dontMock('react-native');
  jest.dontMock('react-native-gesture-handler');
  jest.dontMock('../../../../src/theme');
  jest.dontMock('../../../../src/utils/logger');
  jest.resetModules();
});

describe('AvatarGroup', () => {
  test('空 items 返回 null', () => {
    const { AvatarGroup } = loadAvatarGroup();

    expect(AvatarGroup({ items: [] })).toBeNull();
  });

  test('按输入 key/顺序透传成员属性、统一 square，并用逻辑负间距重叠', () => {
    const { AvatarGroup } = loadAvatarGroup();
    const root = AvatarGroup({
      items: items.slice(0, 3),
      shape: 'square',
      size: 'lg',
    }) as ReactElement<ElementProps>;
    const avatars = childrenOf(root);
    const [rawAvatars] = root.props.children as [
      ReactElement<ElementProps>[],
      null,
    ];

    expect(avatars.every(isAvatarElement)).toBe(true);
    expect(rawAvatars.map((avatar) => avatar.key)).toEqual(['a', 'b', 'c']);
    expect(
      avatars.map(({ props }) => ({
        label: props.label,
        shape: props.shape,
        size: props.size,
        source: props.source,
        variant: props.variant,
      }))
    ).toEqual([
      {
        label: '甲',
        shape: 'square',
        size: 'lg',
        source: undefined,
        variant: 'brand',
      },
      {
        label: '乙',
        shape: 'square',
        size: 'lg',
        source: undefined,
        variant: 'info',
      },
      {
        label: '丙',
        shape: 'square',
        size: 'lg',
        source: undefined,
        variant: 'soft',
      },
    ]);
    expect(avatars[0]?.props.style).toEqual({
      borderColor: 'surface',
      borderWidth: 2,
      marginStart: 0,
      zIndex: 0,
    });
    expect(avatars[1]?.props.style).toEqual({
      borderColor: 'surface',
      borderWidth: 2,
      marginStart: -10,
      zIndex: 1,
    });
  });

  test('静态溢出让 max 包含 +N 位置且不创建 button', () => {
    const { AvatarGroup } = loadAvatarGroup();
    const root = AvatarGroup({
      items,
      max: 5,
      testID: 'team',
    }) as ReactElement<ElementProps>;
    const children = childrenOf(root);
    const overflow = children[4]!;
    const label = overflow.props.children as ReactElement<ElementProps>;

    expect(children.slice(0, 4).every(isAvatarElement)).toBe(true);
    expect(overflow.type).toBe('View');
    expect(overflow.props).toMatchObject({
      accessibilityLabel: '还有 3 位成员',
      testID: 'team-overflow',
    });
    expect(overflow.props.accessibilityRole).toBeUndefined();
    expect(overflow.props.onPress).toBeUndefined();
    expect(label.props.children).toBe('+3');
  });

  test('可点击溢出是具名 button，透传 hint 且每次激活只调用一次', () => {
    const { AvatarGroup } = loadAvatarGroup();
    const onOverflowPress = jest.fn();
    const root = AvatarGroup({
      items,
      max: 5,
      onOverflowPress,
      overflowAccessibilityHint: '打开全部成员',
    }) as ReactElement<ElementProps>;
    const overflow = childrenOf(root)[4]!;

    expect(overflow.type).toBe('Pressable');
    expect(overflow.props).toMatchObject({
      accessibilityRole: 'button',
      accessibilityLabel: '查看其余 3 位成员',
      accessibilityHint: '打开全部成员',
      hitSlop: { top: 6, right: 6, bottom: 6, left: 6 },
    });
    overflow.props.onPress?.();
    expect(onOverflowPress).toHaveBeenCalledTimes(1);
  });

  test('空白 action 名称回退默认文案并去重诊断', () => {
    const { AvatarGroup, warn } = loadAvatarGroup();
    const props = {
      items,
      max: 5,
      onOverflowPress: () => {},
      overflowAccessibilityLabel: '   ',
    } as const;
    const first = AvatarGroup(props) as ReactElement<ElementProps>;
    const second = AvatarGroup(props) as ReactElement<ElementProps>;

    expect(childrenOf(first)[4]?.props.accessibilityLabel).toBe(
      '查看其余 3 位成员'
    );
    expect(childrenOf(second)[4]?.props.accessibilityLabel).toBe(
      '查看其余 3 位成员'
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test('非法 max 展示全部成员并按输入值去重诊断', () => {
    const { AvatarGroup, warn } = loadAvatarGroup();
    const first = AvatarGroup({ items, max: 1 }) as ReactElement<ElementProps>;
    const second = AvatarGroup({ items, max: 1 }) as ReactElement<ElementProps>;

    expect(childrenOf(first)).toHaveLength(7);
    expect(childrenOf(second)).toHaveLength(7);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
