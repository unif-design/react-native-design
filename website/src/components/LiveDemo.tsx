import React, { ReactNode } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ThemeProvider,
  useColors,
  type ColorScheme,
} from '@unif/react-native-design';

type LiveDemoProps = {
  children: ReactNode;
  height?: number | string;
  padding?: number;
  /**
   * 强制锁定主题（不跟随站点主题切换）。
   * 不传 = 跟随 Docusaurus colorMode 自动切换。
   */
  forceScheme?: ColorScheme;
  /**
   * 容器底色：
   *  - `'page'`（默认）：`c.background` 浅灰底,模拟页面底色
   *  - `'surface'`：`c.surface` 白底（亮色）/ `#1C1C1E`（暗色），模拟 Card 内承载
   */
  variant?: 'page' | 'surface';
  /**
   * 容器宽度：
   *  - `false`（默认）：撑满文档正文宽度
   *  - `true`：宽度跟随 children 内容,适合 Drawer / Modal 这种本身就有固定宽度的组件
   */
  inline?: boolean;
};

/** SSG 期喂给 SafeAreaProvider 的初始度量 —— **不给就 build 挂**:
 *  SafeAreaProvider 在 web 上是靠 effect 量 insets 的,而静态渲染在 Node 里跑、effect 不执行
 *  → insets 恒为 null → 任何 `useSafeAreaInsets()`(如 ToastHost)直接 throw
 *  「No safe area value available」,整个页面 SSG 失败。initialMetrics 让 insets 首帧就有值。
 *  demo 是文档正文里的一个 div,本来也不该有安全区 → 全零。 */
const DEMO_METRICS = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/**
 * 把 mdx 内嵌 demo 包进 RN 必要的 Providers + Unif ThemeProvider。
 * - 走 react-native-web 渲染,浏览器里看到的就是真组件本体
 * - 默认 demo 主题跟随 Docusaurus 主题切换(亮 / 暗 toggle 实时联动)
 * - 容器底色用 themed `background` token,跟内部组件视觉一致
 *
 * BrowserOnly 只为躲 `useColorMode`(静态渲染期取不到站点主题)—— **Providers 两条路必须一致**:
 * fallback 曾经裸渲 children(无 Provider),Toast 页的 `<ToastHost/>` 于是在 Node 里跑
 * `useSafeAreaInsets()` 直接炸,文档站 build 长期失败。故 SSG / 浏览器共用下面这一个外壳,
 * 唯一差别是 scheme 从哪来。
 *
 * 关键修复：
 * - GestureHandlerRootView 用 `width: '100%'` 而非 `flex: 1`:docusaurus 文档容器是 block flow
 *   没明确高度,flex:1 会让 GHRV collapse 到 height=0,里面 Pressable 不响应点击
 * - 配合 webpack NormalModuleReplacementPlugin 把 RNGH Pressable 替换成 RN-Web 的 Pressable
 *   (见 plugins/docusaurus-rnw/index.js + shims/RnghPressable.js),让 onPress 真触发
 * - 容器加 `unif-livedemo-frame` className,custom.css 用它做选择器(兜底 input outline、
 *   Unif 字体栈强制)
 */
export function LiveDemo(props: LiveDemoProps) {
  return (
    <BrowserOnly
      // 静态渲染期没有 useColorMode → 锁 forceScheme(未指定则亮色);Providers 一个不少。
      fallback={<LiveDemoFrame {...props} scheme={props.forceScheme ?? 'light'} />}
    >
      {() => <LiveDemoInner {...props} />}
    </BrowserOnly>
  );
}

export default LiveDemo;

/** 浏览器路径:scheme 跟随 Docusaurus 亮 / 暗 toggle 实时联动。 */
function LiveDemoInner(props: LiveDemoProps) {
  const { colorMode } = useColorMode();
  const scheme: ColorScheme =
    props.forceScheme ?? (colorMode === 'dark' ? 'dark' : 'light');
  return <LiveDemoFrame {...props} scheme={scheme} />;
}

/** demo 外壳 —— SSG 与浏览器共用同一套 Providers(见上方 BrowserOnly 注释)。 */
function LiveDemoFrame({
  children,
  height = 'auto',
  padding = 24,
  variant = 'page',
  inline = false,
  scheme,
}: LiveDemoProps & { scheme: ColorScheme }) {
  return (
    <div
      className="unif-livedemo-frame"
      style={inline ? { display: 'inline-block', width: 'fit-content' } : undefined}
    >
      <ThemeProvider forceScheme={scheme}>
        <GestureHandlerRootView style={inline ? { alignSelf: 'flex-start' } : { width: '100%' }}>
          <SafeAreaProvider initialMetrics={DEMO_METRICS}>
            <ThemedFrame height={height} padding={padding} variant={variant} inline={inline}>
              {children}
            </ThemedFrame>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
    </div>
  );
}

function ThemedFrame({
  children,
  height,
  padding,
  variant,
  inline,
}: {
  children: ReactNode;
  height: number | string;
  padding: number;
  variant: 'page' | 'surface';
  inline: boolean;
}) {
  const c = useColors();
  return (
    <View
      style={{
        backgroundColor: variant === 'surface' ? c.surface : c.background,
        padding,
        minHeight: height === 'auto' ? undefined : (height as number),
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.outline,
        marginVertical: 12,
        ...(inline ? { alignSelf: 'flex-start' } : null),
      }}
    >
      {children}
    </View>
  );
}
