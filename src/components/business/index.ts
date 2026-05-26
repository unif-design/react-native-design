// 业务级复合组件 barrel(design 包通用部分)。区别于 src/components/ui:
// - ui/ = atomic widgets(Button / Card / Cell / NavBar / Icon / ...),无业务上下文依赖
// - business/ = 业务复合组件,通用部分(不耦合 navigation / store / SMS 流等)
//   navigation / store 耦合的(ScreenLayout / ModernAppCell / CellList /
//   SmsCodeInput)留在 consumer 仓库
export { GradientWash, RadialHalo, ScreenBackdrop } from './Decorations';
export type {
  GradientWashProps,
  RadialHaloProps,
  ScreenBackdropHalo,
  ScreenBackdropPreset,
  ScreenBackdropProps,
} from './Decorations';

export { GlassStats } from './GlassStats';
export type { GlassStatsProps, GlassStatItem } from './GlassStats';

export { AvatarWithRing } from './AvatarWithRing';
export type { AvatarWithRingProps } from './AvatarWithRing';

export { VersionPill } from './VersionPill';
export type { VersionPillProps } from './VersionPill';
