/** Blur intensity tokens —— backdrop-filter 二档语义化封装。
 *
 *  数值是 `@sbaiahmed1/react-native-blur` 的 BlurView `blurAmount` prop(0-100)。 */
export const blur = {
  /** 玻璃数据条 / 小区域玻璃感。 */
  soft: 10,
  /** 焦点引导大面积 backdrop。 */
  strong: 40,
} as const;

export type BlurIntensity = keyof typeof blur;
