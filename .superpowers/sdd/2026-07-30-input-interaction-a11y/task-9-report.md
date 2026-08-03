# Task 9 报告：Logo / Grid / DrawerHeader / VersionPill 展示语义

## 实现

- `Logo` 删除兼容 `label`，新增可选 `accessibilityLabel`。trim 后非空时设为
  `accessible` image 并使用归一化名称；缺省或空白时在本地 RN `Image` 上应用
  `A11Y_HIDDEN_PROPS`。空白值仍按装饰图片处理，并在 effect 中为每个实例最多输出
  一次 dev 诊断。
- `GridItem` 新增可选 `accessibilityLabel`。纯
  `gridItemAccessibilityLabel()` 优先使用 trim 后非空的显式名称，否则组合
  `label` 与 `badge != null` 的角标，保留 `badge={0}`。展示分支仍为本地 `View`，
  action 分支仍只在 Grid 级 `onPress` 存在时使用 RNGH `Pressable`；badge 视觉
  子树只在本地 RN `View` 上隐藏。
- `DrawerHeader` 将整个 avatar 本地 `View` 从 a11y tree 隐藏，内部 `Image` 和
  fallback initial 都不再形成姓名之外的重复焦点。
- `VersionPill` 删除 `statusColor`，新增公共
  `VersionStatus { label: string; color?: string }` 和 `status`。默认状态为 success
  色的“正常”；caller 提供状态但省略 color 时使用 `foregroundMuted`。状态文字
  在状态点旁可见，外层用全角逗号合并 version、可选 build 与 status，所有视觉
  子节点只在本地 RN `View` / `Text` 上隐藏。
- `VersionStatus` 从 VersionPill component barrel 与 business barrel 导出，包根
  继续通过 `export * from './components/business'` 暴露；两个纯 helper 与
  `A11Y_HIDDEN_PROPS` 均未进入公共 barrel。
- Website、公共 type fixture 和 runtime manual harness 已同步 named/decorative/
  blank Logo、badge 0、Grid display/action、隐藏 Drawer avatar 与可见 status。

## 文件

- 新增：`src/components/ui/Grid/accessibility.ts`
- 新增：`__tests__/components/ui/Grid/accessibility.test.ts`
- 新增：`src/components/business/VersionPill/content.ts`
- 新增：`__tests__/components/business/VersionPill/content.test.ts`
- 修改：`src/components/ui/Logo/{Logo.tsx,types.ts}`
- 修改：`src/components/ui/Grid/{Grid.tsx,types.ts}`
- 修改：`src/components/ui/DrawerHeader/DrawerHeader.tsx`
- 修改：
  `src/components/business/VersionPill/{VersionPill.tsx,styles.ts,types.ts,index.ts}`
- 修改：`src/components/business/index.ts`
- 修改：`type-tests/public-api.tsx`
- 修改：`website/docs/components/{logo,grid,version-pill}.mdx`
- 修改：`manual-tests/runtime-api/RuntimeApiScreen.tsx`
- 记录：本报告与既有 `progress.md` Task 9 start 行

`src/components/ui/index.ts` 已经从各 component barrel 导出 `LogoProps` /
`GridItem`，无需为字段扩展重复改动，也没有导出内部 helper。

## TDD 证据

RED（先添加 pure tests 与 breaking type fixtures，未写 production code）：

```text
$ yarn test __tests__/components/ui/Grid/accessibility.test.ts \
  __tests__/components/business/VersionPill/content.test.ts
exit 1
FAIL Cannot find module '../../../../src/components/ui/Grid/accessibility'
FAIL Cannot find module '../../../../src/components/business/VersionPill/content'

$ yarn typecheck
exit 2
TS2307 两个 pure seam 尚不存在
TS2305 包根尚未导出 VersionStatus
TS2322 Logo 尚不接受 accessibilityLabel
TS2578 Logo.label 的 @ts-expect-error 未使用（旧 alias 仍合法）
TS2322 VersionPill 尚不接受 status
TS2578 VersionPill.statusColor 的 @ts-expect-error 未使用（旧 alias 仍合法）
```

GREEN（最小 helper、类型与组件实现后）：

```text
$ yarn test __tests__/components/ui/Grid/accessibility.test.ts \
  __tests__/components/business/VersionPill/content.test.ts
Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total

$ yarn typecheck
exit 0
```

测试会捕获以下现实回归：truthy badge 判断再次丢失 `0`；空白 override 不回退；
显式名称不再优先；默认/自定义 VersionStatus 颜色错误；组合名称漏 version、build、
status 或改用半角分隔；公共类型重新接受 `label` / `statusColor`。

## 验证

| 命令 | 结果 |
| --- | --- |
| focused Jest | 2 suites / 6 tests passed |
| `yarn typecheck` | exit 0 |
| `yarn test --runInBand` | 23 suites / 288 tests passed |
| `yarn prepare` | module 与 TypeScript definitions 均生成成功 |
| target lint（source/tests/type fixture/manual screen） | exit 0 |
| Website `typecheck` | exit 0 |
| Website `build:llms` | 53 页，`llms-full.txt` 208.3 KB |
| Website `build` | client/server 编译与静态文件生成成功 |
| `git diff --check` | 无 whitespace error |

Website build 的第一次 SSG 尝试真实失败：新增正文中的 `{version}` 被 MDX 当成未定义
表达式，报 `ReferenceError: version is not defined`。按 systematic-debugging 核对
错误路径与本次 diff 后，将抽象花括号改为具体契约示例“版本 2.0.0，build
12，测试中”；第二次 build 成功。成功输出仍包含 Docusaurus 本地 update-check
配置目录权限提示，不影响 client/server 编译和静态产物。

## d.ts 与公共 barrel

- `lib/typescript/src/components/business/VersionPill/types.d.ts` 包含公共
  `VersionStatus` 与 `VersionPillProps.status?: VersionStatus`，不再包含
  `statusColor`。
- `lib/typescript/src/components/ui/Logo/types.d.ts` 包含
  `accessibilityLabel?: string`，不再包含 `label`。
- `lib/typescript/src/components/ui/Grid/types.d.ts` 包含
  `GridItem.accessibilityLabel?: string`。
- component/business declaration barrel 导出 `VersionStatus`；包根通过既有
  business star export 可访问该类型。
- `gridItemAccessibilityLabel`、`resolveVersionStatus`、
  `buildVersionPillLabel` 只生成 component-local declaration，没有被
  `ui/index.d.ts`、`business/index.d.ts` 或包根 barrel 重新导出；
  `A11Y_HIDDEN_PROPS` 同样未泄露。

## Website、llms 与 Design Skill 核对

- Website 三个页面已移除 `Logo.label` / `VersionPill.statusColor` 旧契约，明确
  Logo named/decorative 行为、Grid badge 0 与 conditional action、VersionStatus
  可见文案和“，”组合名称。
- `build:llms` 生成的 `website/static/md/components/{logo,grid,version-pill}.md`
  及 `llms-full.txt` 已直接检查，包含上述新契约；这些产物按仓库规则被 gitignore，
  未手工编辑或强制提交。
- controller 已确认远程 Logo/Grid/VersionPill 文档不可访问或无搜索结果；本任务
  仅以本地源码、Website、生成文档和批准 brief 为事实来源，不声称完成远程核对。
- 已完整只读核对 sibling Design `SKILL.md`。其主文件仅保留 Logo/Grid 组件索引和
  VersionPill business 索引，不镜像本次逐 prop 契约；按照任务边界未修改 sibling
  仓。最终 sibling Skill/reference/doctor 同步与其自身 checks 仍是后续总任务门禁。

## 自审与未完成的人工门禁

- `A11Y_HIDDEN_PROPS` 新增用法只落到本地 RN `Image` / `View` / `Text`；没有透传
  RNGH `Pressable`、第三方 `Icon` 或其他未知组件。
- 没有保留 `label` / `statusColor` compatibility alias；type fixtures 对二者均
  要求编译失败。
- 未修改 `example/`、`AGENTS.md`、`CLAUDE.md` 或 sibling skills 仓。
- 本任务没有运行 RN 0.86.2 native harness 或真实浏览器 screen reader，因此以下
  不能标记 PASS：
  - iOS/Android 与 Website Inspector/读屏核对 Logo 装饰隐藏、named image role/
    label、blank effect 诊断每实例一次；
  - Grid display 无 button role、action 为 button、两者名称含 badge 0，badge
    视觉子树无第二焦点；
  - Drawer avatar 的 Image/fallback 整体隐藏且相邻 name/subtitle 仍可读；
  - VersionPill 状态文字可见、外层名称按全角逗号组合、内部 dot/Text 无重复焦点；
  - image retry identity 由后续 Theme plan 实现与验收；
  - sibling Design Skill 同步并运行其自己的检查。

这些 case 已加入 `manual-tests/runtime-api/RuntimeApiScreen.tsx`，只能在真实人工
verification matrix 完成后转为 PASS。
