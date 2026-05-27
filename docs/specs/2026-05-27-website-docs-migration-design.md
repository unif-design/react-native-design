# Website Docs Migration Design

把 `portal/website/docs/` 已有的"完整版"组件 mdx(40 个)+ 设计 foundational docs(8 个)一次性搬到 `react-native-design/website/`,作为 design 文档站的 v1 完整版。

## 背景

- `react-native-design/website/docs/` 当前只有 `intro.md` + `button.mdx`(commit `72a340d` 的 phase a 骨架)
- `portal/website/docs/components/` 维护着 43 个组件 mdx,通过 webpack alias `@/components/ui` 直接 import portal 本地源码(react-native-web 渲染)
- portal 仓库 `src/components/ui/` 已在 commit `5f132fa` 整体删掉,改用 `@unif/react-native-design` npm 包 —— **portal 后续不再维护这些 mdx,完全由 design 仓库接管**

## 目标

- 把 portal 那 43 个组件 mdx + 8 个 foundational doc 一次性搬到 design 仓库
- 替换 import 路径,从 portal 的本地别名风格(`@/components/ui`)改成消费者风格(`@unif/react-native-design`)—— 跟 MUI / Ant Design / Tamagui / react-native-paper 等行业标准对齐
- `yarn workspace website build` 跑通,在线访问 `https://unif-design.github.io/react-native-design/` 看到完整 docs

## 非目标

- 不补 portal mdx 里没有的内容(a11y 深度 / 设计决策详解等),保留 portal 原内容
- 不调整 mdx 内部结构(LiveDemo 嵌套样式 / props 表样式等)
- 不 copy portal 业务 docs(`chat/*` / `engineering/*`)
- 不 copy 不在 design 包里的组件 mdx(portal-specific 的 ModernAppCell / ScreenLayout / SmsCodeInput / Drawer)

## 范围

### Copy 清单

| 源 | 目标 | 数量 |
|---|---|---|
| `portal/website/docs/components/*.mdx` | `design/website/docs/components/` | ~40(过滤 4 个 portal-specific)|
| `portal/website/docs/design/` 整目录 | `design/website/docs/design/` | 8(intro / principles / voice / donts + tokens 子目录的 colors / typography / spacing-radii-shadows / motion)|
| `portal/website/docs/UNIF-DESIGN.md` | `design/website/docs/UNIF-DESIGN.md` | 1(总览,可选)|

### 过滤(不 copy)

| 文件 | 原因 |
|---|---|
| `components/modern-app-cell.mdx` | ModernAppCell 是 portal 业务组件,不在 design 包 |
| `components/screen-layout.mdx` | 同上 |
| `components/sms-code-input.mdx` | 同上 |
| `components/drawer.mdx` | 用 `@react-navigation/drawer`,portal 业务依赖,跟 design 的 DrawerHeader 不一样 |
| `docs/chat/*`(15 个)| portal AI 聊天业务,跟 design 无关 |
| `docs/engineering/*`(7 个)| portal 实现细节,跟 design 无关 |

## 迁移步骤

### Step 1: 批量 copy mdx 文件

```sh
cd react-native-design/website

# copy components/(过滤 4 个 portal-specific)
mkdir -p docs/components
for f in /Users/liulijun/tongyi/unif/portal/website/docs/components/*.mdx; do
  name="$(basename "$f")"
  case "$name" in
    modern-app-cell.mdx|screen-layout.mdx|sms-code-input.mdx|drawer.mdx) continue ;;
  esac
  cp "$f" "docs/components/$name"
done
cp /Users/liulijun/tongyi/unif/portal/website/docs/components/overview.md docs/components/

# copy design/ 整目录
cp -r /Users/liulijun/tongyi/unif/portal/website/docs/design docs/

# copy UNIF-DESIGN.md
cp /Users/liulijun/tongyi/unif/portal/website/docs/UNIF-DESIGN.md docs/
```

### Step 2: import 路径替换(sed)

```sh
# 在 design/website/docs/ 下批量替换
find docs -name "*.mdx" -o -name "*.md" | xargs sed -i.bak \
  -e "s|from '@/components/ui'|from '@unif/react-native-design'|g" \
  -e "s|from '@/components/business'|from '@unif/react-native-design'|g" \
  -e "s|from '@/theme'|from '@unif/react-native-design'|g" \
  -e "s|from '@/assets/icons'|from '@unif/react-native-design'|g"

# 清理 .bak
find docs -name "*.bak" -delete
```

### Step 3: edge case 处理

- **`version-pill.mdx`** 用了 `import { APP_VERSION } from '@/config/brand'` —— portal 业务配置。改成 hardcode 字符串 `'0.2.0'` 作为 demo 用。
- **静态资源** —— grep mdx 里有没有引用图片(`<img>` / `![](...)`):如有,copy `portal/website/static/img/` 对应文件到 `design/website/static/img/`。

### Step 4: sidebars.ts 重构

从当前 `['intro', 'button']` 改成:

```ts
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'UNIF-DESIGN',
    {
      type: 'category',
      label: '设计原则',
      items: ['design/intro', 'design/principles', 'design/voice', 'design/donts'],
    },
    {
      type: 'category',
      label: 'Design Tokens',
      items: [
        'design/tokens/colors',
        'design/tokens/typography',
        'design/tokens/spacing-radii-shadows',
        'design/tokens/motion',
      ],
    },
    {
      type: 'category',
      label: '组件',
      items: [
        'components/overview',
        // 40 个组件按字母排
        'components/avatar',
        'components/avatar-with-ring',
        'components/blur-layer',
        'components/button',
        // ... 全部 40 个
      ],
    },
  ],
};
```

### Step 5: 验证

```sh
yarn workspace @unif/react-native-design-website build
```

预期:全过。如果某个组件 mdx 跑挂(可能 RN 0.85 strict-api / web 不兼容),记录在 spec footer 的"已知问题"段,后续单独修。

`yarn workspace ... start` 本地 dev 访问每个组件页验证渲染。

## 工作量估算

| 步 | 时间 |
|---|---|
| 1. copy + 过滤 | 15 分钟 |
| 2. sed 路径替换 | 10 分钟 |
| 3. edge case(version-pill / 静态资源)| 20 分钟 |
| 4. sidebars.ts 重组 | 20 分钟 |
| 5. build 验证 + 修踩坑 | 1.5-2 小时 |
| **总** | **2.5-3 小时** |

## 风险 + 缓解

| 风险 | 缓解 |
|---|---|
| RN 0.85 strict-api 引入的 BC,portal mdx 写法不兼容 | 单 PR 提交,逐个组件验证,挂的暂时 sidebar 注释 + 标 TODO |
| portal mdx 引用 portal 静态资源(图片)| Step 3 grep + 复制 |
| LiveDemo 跨仓兼容性 | design 已有 LiveDemo,接口跟 portal 99% 一致,实测验证 |
| 部署后 GitHub Pages 路径问题 | docusaurus.config.ts 已配 `baseUrl: '/react-native-design/'`,无需改 |

## 不在范围内(后续 spec)

- 各组件 mdx 内容**深化**(a11y / 设计决策 / 边界 case)—— 随 feat PR 渐进补
- 增加搜索功能(algolia / lunr)
- i18n 多语言
- 增加"playground"路径(让用户在浏览器直接 fiddle)
