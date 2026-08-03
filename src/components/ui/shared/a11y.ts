/**
 * 装饰性节点从 a11y 树里隐藏所需的**全套**属性 —— 四个平台各认一个,少一个就漏。
 *
 * - `accessible: false` —— iOS/Android 都不把该节点合并成可聚焦元素
 * - `accessibilityElementsHidden` —— iOS 连同后代一起移出 a11y 树
 * - `importantForAccessibility: 'no-hide-descendants'` —— Android 同上
 * - `aria-hidden` —— react-native-web 映射到 DOM 的 `aria-hidden`
 *
 * **只能**落在库内本地的 RN `View` / `Image` / `Text` 上。绝不要展开给未知第三方组件:
 * 它们可能把未识别的 props 原样透传到原生层,或者干脆用同名 prop 表达别的语义。
 * 需要隐藏第三方子树时,用一个本地 View 包住它,把这些属性挂在包装层。
 */
export const A11Y_HIDDEN_PROPS = {
  'accessible': false,
  'accessibilityElementsHidden': true,
  'importantForAccessibility': 'no-hide-descendants',
  'aria-hidden': true,
} as const;
