export type ResolvedRibbonLayout = {
  overlay: {
    position: 'absolute';
    top: number;
    right: number;
    zIndex: number;
    alignItems: 'flex-end';
  };
  bar: { height: number };
  fold: { width: 0; height: 0; borderWidth: number };
};

export function resolveRibbonLayout({
  top,
  barHeight,
  foldSize,
}: {
  top: number;
  barHeight: number;
  foldSize: number;
}): ResolvedRibbonLayout {
  return {
    overlay: {
      position: 'absolute',
      top,
      right: 0,
      zIndex: 1,
      alignItems: 'flex-end',
    },
    bar: { height: barHeight },
    fold: { width: 0, height: 0, borderWidth: foldSize },
  };
}
