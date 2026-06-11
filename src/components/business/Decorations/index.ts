// Decorations 族:GradientWash / RadialHalo / ScreenBackdrop 三件强内聚,
// 共享 GradientStop 类型 + parseRgba 工具 —— 刻意共居一目录、共享 types.ts,
// 不拆单组件目录;CLAUDE.md 组件约定的族式聚合例外。
export { GradientWash } from './GradientWash';
export { RadialHalo } from './RadialHalo';
export { ScreenBackdrop } from './ScreenBackdrop';
export type {
  GradientStop,
  GradientWashProps,
  RadialHaloProps,
  ScreenBackdropHalo,
  ScreenBackdropPreset,
  ScreenBackdropProps,
} from './types';
