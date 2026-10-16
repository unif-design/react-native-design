import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import {
  motion,
  scaleFontMetric,
  useFontScale,
  usePrefersReducedMotion,
} from '../../../theme';
import type { ButtonSizing } from '../Button/types';
import type { IconButtonProps } from '../IconButton/types';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { styles } from './styles';

interface InlineConfirmContentProps {
  icon: IconButtonProps['icon'];
  iconSize: number;
  color: string;
  label: string;
  confirming: boolean;
  sizing: ButtonSizing;
}

export function InlineConfirmContent({
  icon: Icon,
  iconSize,
  color,
  label,
  confirming,
  sizing,
}: InlineConfirmContentProps) {
  const reduced = usePrefersReducedMotion();
  const fontScale = useFontScale();
  const fontSize = scaleFontMetric(sizing.fs, fontScale);
  const progress = useRef(new Animated.Value(confirming ? 1 : 0)).current;
  const previous = useRef(confirming);
  const [labelWidth, setLabelWidth] = useState(0);
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sizing.h, Math.max(sizing.h, labelWidth + sizing.px * 2)],
  });
  useEffect(() => {
    const changed = previous.current !== confirming;
    previous.current = confirming;
    if (reduced || !changed) {
      progress.setValue(confirming ? 1 : 0);
      return;
    }
    const transition = Animated.timing(progress, {
      toValue: confirming ? 1 : 0,
      duration: motion.fast,
      useNativeDriver: false,
      isInteraction: false,
    });
    transition.start();
    return () => transition.stop();
  }, [confirming, progress, reduced]);
  return (
    <Animated.View style={[styles.content, { width, height: sizing.h }]}>
      <View
        {...A11Y_HIDDEN_PROPS}
        pointerEvents="none"
        style={styles.measurement}
      >
        <Text
          style={[styles.label, { fontSize }]}
          numberOfLines={1}
          onLayout={(event) => setLabelWidth(event.nativeEvent.layout.width)}
        >
          {label}
        </Text>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.layer,
          {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        <Icon size={iconSize} color={color} />
      </Animated.View>
      <Animated.View
        {...(!confirming ? A11Y_HIDDEN_PROPS : {})}
        pointerEvents="none"
        style={[styles.layer, { opacity: progress }]}
      >
        <Text style={[styles.label, { color, fontSize }]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
