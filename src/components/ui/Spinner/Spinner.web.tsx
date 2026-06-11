import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useColors } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import type { SpinnerProps } from './types';

const log = createLogger('Spinner');

// React-Native-Web 上 reanimated 4 + worklets 0.9.x 的 useAnimatedStyle 链路在
// web bundle 里跑会触发 `_updatePropsJS` 里 `Object.keys(updates)` 的 worklet
// 回值打包 edge case(animation frame 每帧抛 TypeError),旋转停滞。
// 该 .web.tsx 用纯 CSS @keyframes 替代,native 端仍走 Spinner.tsx 的 reanimated 实现,
// 走 webpack `resolve.extensions = ['.web.tsx', ...]`,bundle 命中 .web 版本。
const SPIN_KEYFRAMES_ID = 'unif-spinner-spin-keyframes';

// tsconfig 不带 DOM lib(库本体是 RN),用 globalThis 兜底访问浏览器 API,
// 类型用 any 通过 strict 检查(实际运行只在 web bundle 命中本文件,document 一定有)。

const win: any = globalThis as any;

function ensureKeyframes() {
  if (typeof win.document === 'undefined') return;
  if (win.document.getElementById(SPIN_KEYFRAMES_ID)) return;
  const style = win.document.createElement('style');
  style.id = SPIN_KEYFRAMES_ID;
  // ⚠️ 安全:注入 <style> 的内容会被浏览器当 CSS 解析。本字符串必须保持「静态
  // 硬编码」,严禁拼接任何外部 / 用户 / props 输入(size / color 等),否则 CSS
  // 注入。每实例的尺寸 / 颜色 / 时长走 RN style + node.style.animation(见下),
  // 不进 keyframes —— 本函数永远只注册这一条固定 0→360deg 规则。
  style.textContent =
    '@keyframes unif-spinner-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
  win.document.head.appendChild(style);
}

export function Spinner({
  size = 18,
  color,
  thickness = 2,
  style,
  testID,
}: SpinnerProps): React.JSX.Element {
  const c = useColors();
  // ref 用 any —— RN View ref 在 web bundle 实际拿到 HTMLDivElement,
  // RN 端拿到 View 实例,统一 any 兼容两端。

  const ref = useRef<any>(null);
  const stroke = color ?? c.primary;
  if (!Number.isFinite(size) || (size as number) < 8) {
    log.warn(`size 应为 ≥8 的有限数，传入 ${size}，已钳到 8`);
  }
  if (Number.isFinite(thickness) && (thickness as number) <= 0) {
    log.warn(`thickness 应为正数，传入 ${thickness}，已 fallback 为 2`);
  }
  const safeSize = Number.isFinite(size) && size > 8 ? size : 8;
  const safeThickness =
    Number.isFinite(thickness) && thickness > 0 ? thickness : 2;

  // RN-Web 把 View 渲染成 div,我们用 ref 拿到底层 DOM 节点直接挂 CSS animation
  // (RN style 不支持 animation 字段;只能事后注入)。
  useEffect(() => {
    ensureKeyframes();
    const node = ref.current;
    if (node && node.style) {
      // essential motion:加载指示在 prefers-reduced-motion 下仍应旋转(与 native 的
      // ReduceMotion.Never 对齐),故意不加 @media (prefers-reduced-motion) 停转。
      node.style.animation = 'unif-spinner-spin 900ms linear infinite';
    }
  }, []);

  return (
    <View
      ref={ref}
      style={[
        {
          width: safeSize,
          height: safeSize,
          borderRadius: safeSize / 2,
          borderWidth: safeThickness,
          borderColor: c.outline,
          borderTopColor: stroke,
        },
        style,
      ]}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
