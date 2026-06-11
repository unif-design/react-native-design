/**
 * 系统「减弱动态效果」开关。
 *
 * native 端的动画由 reanimated 默认 `ReduceMotion.System` 处理(reduce-motion 下自动
 * 跳到端值),此 hook 只有 web 平台的 CSS/JS 动画需要 —— native 恒返回 false,见 `.web.ts`。
 */
export function usePrefersReducedMotion(): boolean {
  return false;
}
