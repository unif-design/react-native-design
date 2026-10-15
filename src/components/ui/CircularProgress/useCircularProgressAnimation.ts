import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  cancelAnimation,
  Easing,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { motion, usePrefersReducedMotion } from '../../../theme';
import type { CircularProgressProps } from './types';

export function useCircularProgressAnimation(
  value: number,
  animated: boolean,
  showLabel: boolean,
  onAnimationComplete: CircularProgressProps['onAnimationComplete']
) {
  const reducedMotion = usePrefersReducedMotion();
  const progress = useSharedValue(value);
  const animationGeneration = useSharedValue(0);
  const generationRef = useRef(0);
  const previousValueRef = useRef(value);
  const callbackRef = useRef(onAnimationComplete);
  const [percentage, setPercentage] = useState(() => Math.round(value * 100));

  useLayoutEffect(() => {
    callbackRef.current = onAnimationComplete;
  });

  const updatePercentage = useCallback((next: number, generation: number) => {
    if (generation === generationRef.current) setPercentage(next);
  }, []);
  const complete = useCallback((target: number, generation: number) => {
    if (generation !== generationRef.current) return;
    setPercentage(Math.round(target * 100));
    callbackRef.current?.(target);
  }, []);

  useAnimatedReaction(
    () =>
      showLabel
        ? {
            percentage: Math.round(progress.value * 100),
            generation: animationGeneration.value,
          }
        : null,
    (current, previous) => {
      if (
        current &&
        (current.percentage !== previous?.percentage ||
          current.generation !== previous?.generation)
      ) {
        scheduleOnRN(updatePercentage, current.percentage, current.generation);
      }
    }
  );

  useLayoutEffect(() => {
    const generation = ++generationRef.current;
    const shouldAnimate =
      animated && !reducedMotion && value > previousValueRef.current;
    previousValueRef.current = value;

    // Publish the generation and target together so old queued frames cannot cross a reset.
    scheduleOnUI(() => {
      'worklet';
      cancelAnimation(progress);
      animationGeneration.value = generation;
      progress.value = shouldAnimate
        ? withTiming(
            value,
            { duration: motion.slow, easing: Easing.linear },
            (finished) => {
              if (finished) scheduleOnRN(complete, value, generation);
            }
          )
        : value;
      if (!shouldAnimate) scheduleOnRN(complete, value, generation);
    });

    return () => {
      generationRef.current = generation + 1;
      cancelAnimation(progress);
    };
  }, [animated, animationGeneration, complete, progress, reducedMotion, value]);

  return { progress, percentage };
}
