import { fixed } from '../../../theme';

export type ResolvedStepperLayout = {
  decrementFrame: {
    width: number;
    height: number;
    alignItems: 'flex-end';
  };
  valueFrame: { width: number; height: number };
  incrementFrame: {
    width: number;
    height: number;
    alignItems: 'flex-start';
  };
};

export function resolveStepperLayout(
  {
    h,
    btn,
    w,
  }: {
    h: number;
    btn: number;
    w: number;
  },
  options?: { compact?: boolean }
): ResolvedStepperLayout {
  if (options?.compact === true) {
    return {
      decrementFrame: {
        width: btn,
        height: fixed.hitTarget,
        alignItems: 'flex-end',
      },
      valueFrame: { width: w, height: fixed.hitTarget },
      incrementFrame: {
        width: btn,
        height: fixed.hitTarget,
        alignItems: 'flex-start',
      },
    };
  }

  const sideWidth = Math.max(fixed.hitTarget, btn);
  const outerHeight = Math.max(fixed.hitTarget, h);
  return {
    decrementFrame: {
      width: sideWidth,
      height: outerHeight,
      alignItems: 'flex-end',
    },
    valueFrame: {
      width: Math.max(fixed.hitTarget, w),
      height: outerHeight,
    },
    incrementFrame: {
      width: sideWidth,
      height: outerHeight,
      alignItems: 'flex-start',
    },
  };
}
