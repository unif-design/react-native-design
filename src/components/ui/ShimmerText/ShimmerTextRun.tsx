import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, processColor, Text } from 'react-native';
import {
  SHIMMER_TEXT_CYCLE_MS,
  SHIMMER_TEXT_HIGHLIGHT,
  SHIMMER_TEXT_WHITE_CONTRAST,
  SHIMMER_TEXT_RADIUS,
  SHIMMER_TEXT_SWEEP_MS,
} from './constants';
import type { ShimmerTextRunProps } from './types';

export const ShimmerTextRun = memo(function Run({
  text,
  color,
  playing,
}: ShimmerTextRunProps) {
  const animation = useRef(new Animated.Value(0)).current;
  const elapsed = useRef(0);
  const characters = useMemo(() => Array.from(text), [text]);
  const highlight =
    processColor(color) === processColor(SHIMMER_TEXT_HIGHLIGHT)
      ? SHIMMER_TEXT_WHITE_CONTRAST
      : SHIMMER_TEXT_HIGHLIGHT;
  const positionScale =
    SHIMMER_TEXT_SWEEP_MS /
    SHIMMER_TEXT_CYCLE_MS /
    (characters.length + 2 * SHIMMER_TEXT_RADIUS);

  useEffect(() => {
    if (!playing) return;
    const started = Date.now();
    const initialElapsed = elapsed.current;
    const sweepEnd = SHIMMER_TEXT_SWEEP_MS / SHIMMER_TEXT_CYCLE_MS;
    const timing = (toValue: number, duration: number, waiting = false) =>
      Animated.timing(animation, {
        toValue,
        duration,
        // Animated 在 start 时读取 delay，扣除 sweep 末帧取整，避免周期累积漂移。
        get delay() {
          if (!waiting) return 0;
          const position =
            (initialElapsed + Date.now() - started) % SHIMMER_TEXT_CYCLE_MS;
          return SHIMMER_TEXT_CYCLE_MS - position;
        },
        easing: Easing.linear,
        useNativeDriver: false,
        isInteraction: false,
      });
    // 所有字已恢复底色；duration=0 的延迟只等待定时器，不请求动画帧。
    const hold = () => timing(sweepEnd, 0, true);
    animation.setValue(
      Math.min(initialElapsed, SHIMMER_TEXT_SWEEP_MS) / SHIMMER_TEXT_CYCLE_MS
    );
    const first =
      initialElapsed < SHIMMER_TEXT_SWEEP_MS
        ? Animated.sequence([
            timing(sweepEnd, SHIMMER_TEXT_SWEEP_MS - initialElapsed),
            hold(),
          ])
        : hold();
    const cycle = Animated.loop(
      Animated.sequence([
        timing(0, 0),
        timing(sweepEnd, SHIMMER_TEXT_SWEEP_MS),
        hold(),
      ]),
      { iterations: -1, resetBeforeIteration: false }
    );
    // 首轮接续暂停相位，其后每轮仍为原来的完整周期。
    const playback = Animated.loop(Animated.sequence([first, cycle]), {
      iterations: 1,
      resetBeforeIteration: false,
    });
    playback.start();
    return () => {
      const position =
        (initialElapsed + Date.now() - started) % SHIMMER_TEXT_CYCLE_MS;
      playback.stop();
      // JS 驱动的末帧可能早于失焦事件；保存实际颜色相位，恢复首帧不跳色。
      animation.stopAnimation((value) => {
        elapsed.current =
          value < sweepEnd ? value * SHIMMER_TEXT_CYCLE_MS : position;
      });
    };
  }, [animation, playing]);

  const content = useMemo(
    () =>
      characters.map((character, index) => (
        <Animated.Text
          key={`${index}:${character}`}
          style={{
            color: animation.interpolate({
              inputRange: [
                index * positionScale,
                (index + SHIMMER_TEXT_RADIUS) * positionScale,
                (index + 2 * SHIMMER_TEXT_RADIUS) * positionScale,
              ],
              outputRange: [color, highlight, color],
              extrapolate: 'clamp',
            }),
          }}
        >
          {character}
        </Animated.Text>
      )),
    [animation, characters, color, highlight, positionScale]
  );

  return <Text>{content}</Text>;
});
