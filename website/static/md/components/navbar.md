---
sidebar_position: 1
title: NavBar 导航栏
description: '页面顶部的标题与操作区域。'
---

<!-- Generated from @unif/react-native-design; edit source documentation. -->

# NavBar 导航栏

页面顶部导航栏，提供标题与左右操作区域。默认使用无额外染色的系统玻璃表面；品牌态保持品牌色，transparent 仍完全透明。默认表面在 Android、旧 iOS 或减少透明度时使用主题 `surface` 实色。Web 保留 CSS 近似材质；无 CSS 模糊能力且未启用减少透明度时使用主题渐变。

## 代码演示 {#实时预览}

```tsx
const NavBarDemo = () => {
  const [action, setAction] = useState('尚未操作');
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span className="demo-label">默认 · 含副标题</span>
        <View
          style={{
            borderWidth: 1,
            borderColor: 'var(--ifm-color-emphasis-200)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <NavBar
            title="AI 助手"
            subtitle="在线 · 已同步"
            left={{
              icon: MenuOutlined,
              onPress: () => setAction('打开抽屉'),
              accessibilityLabel: '抽屉',
            }}
            right={{
              icon: MoreHOutlined,
              onPress: () => setAction('打开更多菜单'),
              accessibilityLabel: '更多',
            }}
          />
        </View>
        <span className="demo-label">品牌橙底 · variant="brand"</span>
        <View
          style={{
            borderWidth: 1,
            borderColor: 'var(--ifm-color-emphasis-200)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <NavBar
            title="登录"
            variant="brand"
            left={{
              icon: ArrowLeftOutlined,
              onPress: () => setAction('返回登录页'),
              accessibilityLabel: '返回',
            }}
            right={{
              icon: MoreHOutlined,
              onPress: () => setAction('打开登录页菜单'),
              accessibilityLabel: '更多',
            }}
          />
        </View>
        <span className="demo-label">
          透明无边框 · variant="transparent"（深字，浮在浅色 hero 渐变上）
        </span>
        <View
          style={{
            borderWidth: 1,
            borderColor: 'var(--ifm-color-emphasis-200)',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #FFE3C8, #FFF0DD)',
          }}
        >
          <NavBar
            title="我的名片"
            variant="transparent"
            left={{
              icon: ArrowLeftOutlined,
              onPress: () => setAction('返回名片列表'),
              accessibilityLabel: '返回',
            }}
            right={{
              icon: MoreHOutlined,
              onPress: () => setAction('打开名片菜单'),
              accessibilityLabel: '更多',
            }}
          />
        </View>
        <span className="demo-label">最近操作：{action}</span>
      </div>
    </>
  );
};
```

## 用法

```tsx
import {
  ArrowLeftOutlined,
  MenuOutlined,
  MoreHOutlined,
} from '@unif/react-native-icons';
import { NavBar } from '@unif/react-native-design';

<NavBar
  title="AI 助手"
  subtitle="在线 · 已同步"
  left={{
    icon: MenuOutlined,
    onPress: openDrawer,
    accessibilityLabel: '打开抽屉',
  }}
  right={{
    icon: MoreHOutlined,
    onPress: openMenu,
    accessibilityLabel: '打开更多菜单',
  }}
/>;

{
  /* 品牌橙底 */
}
<NavBar title="登录" variant="brand" />;

{
  /* 透明浮层（深字）—— 浮在浅色 hero 渐变之上的子页 */
}
<NavBar
  title="我的名片"
  variant="transparent"
  left={{
    icon: ArrowLeftOutlined,
    onPress: goBack,
    accessibilityLabel: '返回',
  }}
/>;
```

标题统一使用 `type.h2`（基础 17）与 `fw.semi`（600），并跟随 ThemeProvider 字号缩放。

## API

| 参数       | 类型                                    | 默认值      | 说明                                                                                                                                                                                             |
| ---------- | --------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`    | `string`                                | —           | 居中标题                                                                                                                                                                                         |
| `subtitle` | `string?`                               | —           | 副标题（小字号，主标题下方）                                                                                                                                                                     |
| `left`     | `NavBarSlot`                            | —           | 左槽：严格 `NavBarAction { icon, onPress, accessibilityLabel }` 或展示用 `ReactNode`                                                                                                             |
| `right`    | `NavBarSlot`                            | —           | 右槽，同 `left`                                                                                                                                                                                  |
| `variant`  | `'default' \| 'brand' \| 'transparent'` | `'default'` | `default` 为系统玻璃、hairline 和主题文字；`brand` 为品牌橙底与白字；`transparent` 无背景与边框，文字使用当前主题 `c.foreground` |
| `style`    | `StyleProp<ViewStyle>?`                 | —           | 根容器附加样式（margin / position 等布局微调）                                                                                                                                                   |
| `testID`   | `string?`                               | —           | E2E 定位                                                                                                                                                                                         |

> `left` / `right` 传完整 `NavBarAction` 时渲染为内部 `IconButton`（`variant='ghost'`，icon 使用从 Icons 导入的 `ComponentType<IconProps>`）。展示节点中的 `string` / `number` / `bigint`（包括 Fragment、nested collection 与 thenable resolved value 内的 primitive）会递归包装为本地 `Text`；非 Fragment element / portal 保持原有语义。thenable 映射按稳定源对象缓存，拒绝原因保持不变，非法 resolved value 失败关闭。缺字段、非法 icon 或 malformed node 会在 effect 中诊断并渲染为空。

## 安全区（Safe Area）

**NavBar 不内置 top safe-area inset**，由宿主页面负责。推荐做法：

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

// 页面或自定义导航 header 中均由宿主包裹
<SafeAreaView edges={['top']}>
  <NavBar title="首页" />
</SafeAreaView>;

```

这样 NavBar 本体可在任何场景复用（modal、底部抽屉 header、全屏画中画等不需要 top inset 的场景）。

## 无障碍（a11y）

来源：`src/components/ui/NavBar/NavBar.tsx`、`isSlot.ts`、`types.ts`。

- 主标题 `title` 的 `<Text>` 使用 `accessibilityRole="header"`，可由屏幕阅读器按标题定位；根 `<View>` 不合并左右动作，`subtitle` 保留普通文本语义。
- a11y props：`left` / `right` 槽的 `NavBarAction.accessibilityLabel` **必填且非空**；action 同时必须有函数 `onPress`。若传展示用 `ReactNode`，React element 自行负责 a11y，primitive 文本由库内本地 `Text` 自然朗读。
- 状态语义：NavBar 自身无可切换状态，不附加 `accessibilityState`。

```tsx
import { ArrowLeftOutlined, MoreHOutlined } from '@unif/react-native-icons';
// action 的 icon、onPress、accessibilityLabel 都必填
<NavBar
  title="登录"
  left={{
    icon: ArrowLeftOutlined,
    onPress: goBack,
    accessibilityLabel: '返回',
  }}
  right={{ icon: MoreHOutlined, onPress: openMenu, accessibilityLabel: '更多' }}
/>;
```

## 关联组件

- [DrawerHeader](drawer-header.md) —— `@react-navigation/drawer` 顶部的品牌面板
- [TabBar](tabbar.md) —— 固定底部主导航
