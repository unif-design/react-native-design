# CircularProgress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `@unif/react-native-design` 增加可确定进度的圆形进度组件，支持可选中央百分比文字，并让 Portal 图片附件上传态复用同一公共组件。

**Architecture:** `CircularProgress` 只接收 `0..1` 的 `value`，由 pure normalizer 统一处理异常值、尺寸与线宽；视觉使用 `react-native-svg` 两条圆环，外层 View 暴露 progressbar 可访问性语义。中央文字由 `showLabel` 显式开启，默认关闭。

**Tech Stack:** React Native、TypeScript、react-native-svg、Jest、Design example catalog、Docusaurus。

## Public Contract

```ts
export type CircularProgressProps = {
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
  labelColor?: string;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};
```

- `value` 以 `0..1` 表示，非有限值归零，越界值收敛到边界。
- 默认 `size=32`、`thickness=2`、`showLabel=false`。
- 未提供颜色时使用 design 语义 token；组件不负责外层半透明背景。
- 可访问性值始终暴露 `0..100` 百分比，视觉文字不重复朗读。

### Task 1: Build the contract test-first

**Files:**

- Create: `src/components/ui/CircularProgress/*`
- Create: `__tests__/components/ui/CircularProgress/*`
- Modify: `src/components/ui/index.ts`
- Modify: `src/index.ts`
- Modify: `type-tests/index.tsx`

- [ ] 为 normalizer、圆环 dash offset、默认无文字、`showLabel`、a11y value 写失败测试。
- [ ] 实现 pure normalizer、组件、样式和具名 barrel。
- [ ] 运行 CircularProgress 定向 Jest、type tests 与公共导出契约。

### Task 2: Add runnable examples and documentation

**Files:**

- Modify: `example/src/catalog/componentCatalog.ts`
- Modify: `example/src/showcases/feedback/*`
- Modify: `website/docs/components/*`
- Modify: `llms.txt`

- [ ] 在 Feedback 场景展示无文字与带百分比两个状态。
- [ ] 文档说明取值、颜色、可访问性与 `showLabel`。
- [ ] 运行 example showcase、website/llms 生成与漂移验证。

### Task 3: Verify the package boundary

- [ ] 运行 `yarn lint`、`yarn typecheck`、相关 Jest、`yarn verify:example-showcase`。
- [ ] 检查只通过顶层公开导出使用，且不手动修改版本或发布包。
