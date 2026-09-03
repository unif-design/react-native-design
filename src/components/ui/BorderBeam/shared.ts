export type BorderBeamLayout = Readonly<{ width: number; height: number }>;

export const EMPTY_BORDER_BEAM_LAYOUT: BorderBeamLayout = {
  width: 0,
  height: 0,
};

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
