import { memo, useEffect, useRef } from 'react';
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
}: ShimmerTextRunProps) {
  const animation = useRef(new Animated.Value(0)).current;
  const characters = Array.from(text);
  const highlight =
    processColor(color) === processColor(SHIMMER_TEXT_HIGHLIGHT)
      ? SHIMMER_TEXT_WHITE_CONTRAST
      : SHIMMER_TEXT_HIGHLIGHT;
  const positionScale =
    SHIMMER_TEXT_SWEEP_MS /
    SHIMMER_TEXT_CYCLE_MS /
    (characters.length + 2 * SHIMMER_TEXT_RADIUS);

  useEffect(() => {
    // 嵌套文字是虚拟文本节点；JS 驱动才能将颜色更新交给原生段落。
    const loop = Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: SHIMMER_TEXT_CYCLE_MS,
        easing: Easing.linear,
        useNativeDriver: false,
        isInteraction: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [animation]);

  return (
    <Text>
      {characters.map((character, index) => (
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
      ))}
    </Text>
  );
});
