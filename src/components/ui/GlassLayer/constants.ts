/** 仅用于 Web CSS 近似效果的像素值，不表示原生材质的模糊半径。 */
export const webGlassBlur = { clear: 10, regular: 40 } as const;

/** 无原生模糊时保持主题层次，clear 更通透；只用于装饰渐变。 */
export const glassGradientOpacity = {
  clear: [0.72, 0.44],
  regular: [0.92, 0.76],
} as const;
