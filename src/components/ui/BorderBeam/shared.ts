export type BorderBeamLayout = Readonly<{ width: number; height: number }>;

export const EMPTY_BORDER_BEAM_LAYOUT: BorderBeamLayout = {
  width: 0,
  height: 0,
};

const BORDER_BEAM_TRAIL = [
  { lengthRatio: 1, opacity: 0.12 },
  { lengthRatio: 0.75, opacity: 0.24 },
  { lengthRatio: 0.5, opacity: 0.42 },
  { lengthRatio: 0.25, opacity: 0.88 },
] as const;

/**
 * 把单色线段拆成由淡到亮的叠加尾迹。
 *
 * 所有层共享同一动画相位，较短且更亮的层叠在前端，形成接近渐变的彗星头；
 * 同时避免 SVG gradient 在 Native/Web 上的实现差异。
 */
export function borderBeamTrail(beamLength: number) {
  const safeLength = Math.max(0, beamLength);
  return BORDER_BEAM_TRAIL.map(({ lengthRatio, opacity }) => ({
    length: safeLength * lengthRatio,
    opacity,
  }));
}

export function borderBeamGeometry(input: {
  layout: BorderBeamLayout;
  lineWidth: number;
  size: number;
  borderRadius: number;
}) {
  const { layout, lineWidth } = input;
  const rectWidth = Math.max(0, layout.width - lineWidth);
  const rectHeight = Math.max(0, layout.height - lineWidth);
  const perimeter = Math.max(0, 2 * (rectWidth + rectHeight));
  const beamLength = Math.min(input.size, perimeter / 2);
  return {
    beamLength,
    perimeter,
    rectHeight,
    rectWidth,
    radius: Math.min(input.borderRadius, rectWidth / 2, rectHeight / 2),
  };
}
