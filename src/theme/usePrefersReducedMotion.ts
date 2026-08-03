import { useReducedMotion } from 'react-native-reanimated';

/**
 * native:读取 iOS / Android 系统「减弱动态效果」设置。
 *
 * 为什么必须真读系统值 —— Reanimated 的 `ReduceMotion.System` 只覆盖它自己驱动的
 * `withTiming` / `withSpring` 等动画;组件自己用 `setInterval`、RAF、Modal 转场或
 * autoplay 做的动效完全不在它管辖内。本 hook 曾恒返回 `false`,导致 native 端
 * Pulse、Carousel autoplay 等路径在系统开启减弱动效后仍继续动。
 *
 * 消费方(Pulse、Switch、Carousel、Reveal……)必须显式分支到这个 hook,不能假设
 * 动画引擎已替自己处理了该偏好。
 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion();
}
