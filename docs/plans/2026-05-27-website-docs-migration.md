# Website Docs Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`(recommended)or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `portal/website/docs/` 已有的 38 个组件 mdx + 8 个 foundational docs + 1 个总览搬到 `react-native-design/website/`,作为 design 文档站 v1 完整版。

**Architecture:** 批量 cp + sed 替换 import 路径(`@/components/ui` → `@unif/react-native-design`)+ 重构 sidebars.ts + `yarn workspace website build` 验证。design 的 webpack plugin 已经把 `@unif/react-native-design$` alias 到 `src/index.tsx` 本地源码,迁移后 mdx 仍走本地源码渲染。

**Tech Stack:** Docusaurus 3 + React Native Web + bash/sed migration tooling

---

## File Structure

| 操作 | 文件 | 责任 |
|---|---|---|
| Created(38) | `website/docs/components/*.mdx`(`avatar.mdx` 到 `version-pill.mdx`,按字母)| 单组件 demo + props 说明 |
| Created(1) | `website/docs/components/overview.md` | 组件列表总览 |
| Created(4) | `website/docs/design/{intro,principles,voice,donts}.md` | 设计原则 |
| Created(4) | `website/docs/design/tokens/{colors.mdx,typography.md,spacing-radii-shadows.md,motion.md}` | tokens |
| Created(1) | `website/docs/UNIF-DESIGN.md` | 总览(可选)|
| Modified | `website/sidebars.ts` | 重构成三段:设计 / Tokens / 组件 |
| Deleted | `website/docs/button.mdx` | portal 完整版 `components/button.mdx` 替代 |

总产物:48 个 .mdx/.md + 1 个 sidebars.ts 重写 + 1 个删除。

---

## Task 1: 批量 copy + 过滤

**Files:**
- Create: `website/docs/components/` 目录 + 38 个 .mdx + overview.md
- Create: `website/docs/design/` 目录 + 8 个文件
- Create: `website/docs/UNIF-DESIGN.md`
- Delete: `website/docs/button.mdx`

- [ ] **Step 1: 创建 feature branch + 切到 design 仓库**

```sh
cd /Users/liulijun/tongyi/unif/react-native-design
git switch main
git pull --ff-only
git switch -c feat/website-docs-migration
```

- [ ] **Step 2: 创建目标目录**

```sh
mkdir -p website/docs/components
mkdir -p website/docs/design/tokens
```

- [ ] **Step 3: 批量 copy 38 个组件 mdx(过滤 4 个 portal-specific)**

```sh
PORTAL=/Users/liulijun/tongyi/unif/portal
for f in "$PORTAL/website/docs/components/"*.mdx; do
  name="$(basename "$f")"
  case "$name" in
    modern-app-cell.mdx|screen-layout.mdx|sms-code-input.mdx|drawer.mdx)
      echo "skip: $name(portal-specific)"
      continue ;;
  esac
  cp "$f" "website/docs/components/$name"
done
cp "$PORTAL/website/docs/components/overview.md" website/docs/components/
```

Expected output:
```
skip: drawer.mdx(portal-specific)
skip: modern-app-cell.mdx(portal-specific)
skip: screen-layout.mdx(portal-specific)
skip: sms-code-input.mdx(portal-specific)
```

- [ ] **Step 4: copy design/ + tokens/ 整目录**

```sh
cp -r "$PORTAL/website/docs/design/." website/docs/design/
```

- [ ] **Step 5: copy UNIF-DESIGN.md**

```sh
cp "$PORTAL/website/docs/UNIF-DESIGN.md" website/docs/
```

- [ ] **Step 6: 删 design 当前的 phase-a button.mdx(被 components/button.mdx 替代)**

```sh
rm website/docs/button.mdx
```

- [ ] **Step 7: 验证文件数**

```sh
ls website/docs/components/*.mdx | wc -l
# Expected: 38

ls website/docs/components/*.md | wc -l
# Expected: 1 (overview.md)

ls website/docs/design/*.md | wc -l
# Expected: 4 (intro / principles / voice / donts)

ls website/docs/design/tokens/* | wc -l
# Expected: 4 (colors.mdx + 3 .md)

ls website/docs/UNIF-DESIGN.md
# Expected: exists

ls website/docs/button.mdx 2>&1
# Expected: No such file or directory
```

- [ ] **Step 8: Commit (Task 1)**

```sh
git add website/docs/
git commit -m "feat(docs): copy portal mdx 到 design website(未替换 import 路径)

迁移源:portal/website/docs/{components,design,UNIF-DESIGN.md}
过滤:modern-app-cell / screen-layout / sms-code-input / drawer(portal-specific)

下一步:sed 替换 import 路径 + 重写 sidebars + 验证 build"
```

---

## Task 2: sed 替换 import 路径

**Files:**
- Modify: `website/docs/components/*.mdx`(38)
- Modify: `website/docs/design/tokens/colors.mdx`(可能)
- Modify: `website/docs/UNIF-DESIGN.md`(可能)

- [ ] **Step 1: grep 当前所有 import 路径(看现状)**

```sh
grep -rhE "^import" website/docs/ | sort -u
```

Expected: 看到 `from '@/components/ui'` / `'@/components/business'` / `'@/theme'` / `'@/assets/icons'` 等。记录 unique 行用于验证替换完整性。

- [ ] **Step 2: sed 批量替换 4 类 portal-local 路径**

```sh
find website/docs -name "*.mdx" -o -name "*.md" | while read f; do
  sed -i.bak \
    -e "s|from '@/components/ui'|from '@unif/react-native-design'|g" \
    -e "s|from '@/components/business'|from '@unif/react-native-design'|g" \
    -e "s|from '@/theme'|from '@unif/react-native-design'|g" \
    -e "s|from '@/assets/icons'|from '@unif/react-native-design'|g" \
    "$f"
done
find website/docs -name "*.bak" -delete
```

- [ ] **Step 3: 验证替换完整性**

```sh
# 应该不再有 @/components 引用
grep -rh "@/components" website/docs/ | head
# Expected: empty

# 应该不再有 @/theme 引用
grep -rh "@/theme" website/docs/ | head
# Expected: empty

# 应该不再有 @/assets/icons 引用
grep -rh "@/assets/icons" website/docs/ | head
# Expected: empty

# 应该看到大量 @unif/react-native-design import
grep -rh "@unif/react-native-design" website/docs/ | head
# Expected: 多行,如 "import { Button } from '@unif/react-native-design';"
```

- [ ] **Step 4: 找出剩余 portal-specific import(如有)**

```sh
grep -rh "^import" website/docs/ | grep -vE "@unif/react-native-design|@docusaurus|@site|react-native|@react-navigation" | sort -u
```

Expected:看到 `import { APP_VERSION } from '@/config/brand'` 这种残留(Task 3 处理)。

- [ ] **Step 5: Commit (Task 2)**

```sh
git add website/docs/
git commit -m "feat(docs): 把 mdx 里 @/components/* 替换为 @unif/react-native-design

sed 批量替换 4 类 portal-local 路径(@/components/ui / business / theme / assets/icons)。
design 的 webpack plugin 仍把 @unif/react-native-design alias 到 src/index.tsx 本地源码,渲染走本地。"
```

---

## Task 3: edge case 处理(APP_VERSION + 静态资源)

**Files:**
- Modify: `website/docs/components/version-pill.mdx`(APP_VERSION)
- (条件)Create: `website/static/img/...`(若 mdx 引用了图片)

- [ ] **Step 1: 处理 version-pill.mdx 的 APP_VERSION**

```sh
grep -n "APP_VERSION\|@/config/brand" website/docs/components/version-pill.mdx
```

Expected: 看到 `import { APP_VERSION } from '@/config/brand';` 这类行。

打开文件,把 import 行删掉,在 mdx 里把 `{APP_VERSION}` 替换成字符串 `"0.2.0"`(或当前 design 版本)。

具体修改示例:
```diff
- import { APP_VERSION } from '@/config/brand';
- import { VersionPill } from '@unif/react-native-design';
+ import { VersionPill } from '@unif/react-native-design';

  <LiveDemo>
-   <VersionPill version={APP_VERSION} />
+   <VersionPill version="0.2.0" />
  </LiveDemo>
```

- [ ] **Step 2: 验证 grep 干净**

```sh
grep -rh "@/config\|APP_VERSION" website/docs/
# Expected: empty
```

- [ ] **Step 3: 找出剩余未识别 import**

```sh
grep -rh "^import" website/docs/ | grep -vE "@unif/react-native-design|@docusaurus|@site|^import React|^import type" | sort -u
```

Expected: 应该只剩 `import { X } from 'react-native'` / `import { ... } from '@react-navigation/...'`(如果有未过滤的)/ 静态资源 import。

如果有 `@react-navigation/*`(漏过滤的 mdx),需要回头检查 Task 1 过滤是否完整。

- [ ] **Step 4: 找静态资源引用**

```sh
grep -rhE 'src=["'\'']\.\/|src=["'\'']/img|!\[\]\(' website/docs/ | head -20
```

Expected:看到 `<img src="./xxx.png" />` 或 `![](./xxx.png)` 这种相对路径资源引用。

如有:从 `portal/website/static/img/` 找对应文件 cp 到 `react-native-design/website/static/img/`。

- [ ] **Step 5: Commit (Task 3)**

```sh
git add website/docs/
git commit -m "feat(docs): 处理 version-pill 的 APP_VERSION 和静态资源

version-pill.mdx:删 portal 的 @/config/brand import,APP_VERSION hardcode 成 demo 用的字符串。
静态资源:从 portal/website/static/ 复制 mdx 引用到的资源(如有)。"
```

---

## Task 4: 重写 sidebars.ts

**Files:**
- Modify: `website/sidebars.ts`

- [ ] **Step 1: 备份当前 sidebars.ts(查阅用)**

```sh
cat website/sidebars.ts
```

记下当前内容(应该是 `['intro', 'button']`)。

- [ ] **Step 2: 用新内容覆盖 sidebars.ts**

```sh
cat > website/sidebars.ts <<'TS_EOF'
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'UNIF-DESIGN',
    {
      type: 'category',
      label: '设计原则',
      items: [
        'design/intro',
        'design/principles',
        'design/voice',
        'design/donts',
      ],
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
        'components/avatar',
        'components/avatar-with-ring',
        'components/blur-layer',
        'components/button',
        'components/card',
        'components/carousel',
        'components/cell',
        'components/checkbox',
        'components/chip',
        'components/confirm',
        'components/decorations',
        'components/empty',
        'components/entry-card',
        'components/form',
        'components/glass-stats',
        'components/grid',
        'components/icon-button',
        'components/icons',
        'components/input',
        'components/loading',
        'components/logo',
        'components/navbar',
        'components/password-input',
        'components/pulse',
        'components/radio',
        'components/search',
        'components/skeleton',
        'components/status-dot',
        'components/stepper',
        'components/switch',
        'components/tabbar',
        'components/tabs',
        'components/tag',
        'components/text-field',
        'components/textarea',
        'components/thumbnail',
        'components/toast',
        'components/version-pill',
      ],
    },
  ],
};

export default sidebars;
TS_EOF
```

- [ ] **Step 3: 检查 sidebars.ts 引用的所有 ID 文件都存在**

```sh
for id in intro UNIF-DESIGN \
  design/intro design/principles design/voice design/donts \
  design/tokens/colors design/tokens/typography design/tokens/spacing-radii-shadows design/tokens/motion \
  components/overview components/avatar components/avatar-with-ring components/blur-layer \
  components/button components/card components/carousel components/cell components/checkbox \
  components/chip components/confirm components/decorations components/empty components/entry-card \
  components/form components/glass-stats components/grid components/icon-button components/icons \
  components/input components/loading components/logo components/navbar components/password-input \
  components/pulse components/radio components/search components/skeleton components/status-dot \
  components/stepper components/switch components/tabbar components/tabs components/tag \
  components/text-field components/textarea components/thumbnail components/toast components/version-pill; do
  if [[ ! -f "website/docs/$id.mdx" && ! -f "website/docs/$id.md" ]]; then
    echo "✗ 缺:$id"
  fi
done
echo "如果没有 ✗ 输出,所有 sidebar 条目都有对应文件"
```

Expected: 无 `✗` 输出。

- [ ] **Step 4: Commit (Task 4)**

```sh
git add website/sidebars.ts
git commit -m "feat(docs): sidebars.ts 重组三段(设计原则 / Tokens / 组件)

入口:intro + UNIF-DESIGN 总览
设计原则:intro / principles / voice / donts
Design Tokens:colors / typography / spacing / motion
组件:overview + 38 个组件按字母排"
```

---

## Task 5: 验证 yarn workspace website build

**Files:** 修踩坑时可能涉及任何 mdx 文件。

- [ ] **Step 1: 跑 build**

```sh
yarn workspace @unif/react-native-design-website build 2>&1 | tee /tmp/website-build.log | tail -30
```

预期:**全过** 或 **少量 mdx 报错**。报错信息会指向具体文件 + 行号。

- [ ] **Step 2: 看完整 build log 找 errors / warnings**

```sh
grep -iE "error|warning|failed|broken" /tmp/website-build.log | head -30
```

- [ ] **Step 3: 处理 broken link warnings(若有)**

可能 mdx 之间有 cross-reference 用了 portal 的 path(`/docs/chat/xxx`),migration 后那些 path 在 design 不存在 → broken。

```sh
grep -rhE "\]\(/docs/(chat|engineering)" website/docs/ | head -10
```

修法:删掉那些 portal-specific 链接,或者改成"详见 portal 文档"外链。

- [ ] **Step 4: 处理 module resolution errors(若有)**

如果某个 mdx 跑挂"Cannot find module"之类错误,通常因为它 import 了 design 包没 export 的 symbol。

```sh
# 检查 design 包导出
grep -E "^export" /Users/liulijun/tongyi/unif/react-native-design/src/index.tsx
```

如果 mdx 用的 symbol 在 design 包不存在(比如 portal-only utility),在那个 mdx 里替换或删 demo 段。

- [ ] **Step 5: 处理 LiveDemo 渲染错误(若有)**

可能 RN 0.85 strict-api 的 BC 让某些组件 prop 类型变了,portal 旧 mdx 不兼容。

修法:删该 demo 段,或者按当前 design 的 props API 改。挂的组件**暂时 sidebar 注释 + mdx 顶部标 TODO**,不阻塞整体 build。

- [ ] **Step 6: 反复迭代直到 build 通过**

每 fix 一类错误后重跑:
```sh
yarn workspace @unif/react-native-design-website build 2>&1 | tail -15
```

直到看到:
```
✔ Client: Compiled successfully in Xs
[SUCCESS] Generated static files in "build".
```

- [ ] **Step 7: 本地 dev server 抽样验证**

```sh
yarn workspace @unif/react-native-design-website start
```

浏览器开 `http://localhost:3000`,抽样点 5-10 个组件页验证渲染:
- intro / UNIF-DESIGN
- design/principles / design/tokens/colors
- components/button / components/card / components/avatar
- components/toast / components/confirm(命令式 API,验证 host)
- components/icons(IconCatalog 大列表,验证 svg 渲染)

按 Ctrl+C 退出 dev server。

- [ ] **Step 8: Commit 修踩坑改动**

```sh
git add website/
git commit -m "fix(docs): build 验证修踩坑

[列出实际修的:broken link / module not found / RN 0.85 BC / 等]"
```

---

## Task 6: push + 开 PR

- [ ] **Step 1: push feature branch**

```sh
git push -u origin feat/website-docs-migration
```

- [ ] **Step 2: 在 GitHub UI 开 PR**

```
base: main
compare: feat/website-docs-migration

标题:feat(docs): 迁移 portal 的完整组件 mdx 到 design 文档站
描述:简述本次 migration(spec 文档链接 + 主要变更)
```

- [ ] **Step 3: 等 CI 全过 + PR Agent review + Pages workflow 重 deploy**

预期 CI:`lint / test / build-library / build-android / build-ios` 5 个都过(纯 docs 改动,不影响主代码)。

deploy-docs.yml 也会触发(因为 paths 含 `website/**`),把新 docs 推到 GitHub Pages。

- [ ] **Step 4: Squash and merge + 验证线上**

merge 后 deploy 自动跑,等 ~3 分钟后访问:

```
https://unif-design.github.io/react-native-design/
```

应该看到:
- 左侧 sidebar 有 5 个 category(入门 / UNIF-DESIGN / 设计原则 / Tokens / 组件)
- 组件类有 38 + overview 共 39 个条目
- 点 button / card / icons 等能正常渲染 LiveDemo

---

## 已知风险 / 后续处理

- 部分 mdx 可能因 RN 0.85 strict-api / react-native-web 兼容性挂,本 plan 允许在 Task 5 标 TODO 跳过(sidebar 注释相应条目),后续单独 PR 修。spec 说明"迁移目标是 v1,不补深度内容"。
- portal 的 docs 历史链接(`portal-docs/...`)如果指向已迁移的页面,migration 后 portal 那边可以选择"删 portal/website/docs/components" 或"加 redirect 到 design docs"(本 plan 不处理 portal 端)。
- 若 dead link 大量出现,可在 docusaurus.config.ts 把 `onBrokenLinks: 'warn'` 改为 `'ignore'` 临时绕过,但建议 fix 不绕。
