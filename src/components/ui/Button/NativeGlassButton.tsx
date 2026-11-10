import React, { useState } from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';
import { LiquidGlassView } from '@callstack/liquid-glass';
import {
  pressedOpacity,
  usePrefersReducedMotion,
  useTheme,
} from '../../../theme';
import { useGlassFallback } from '../GlassLayer/useGlassFallback';
import type { NativeGlassButtonProps } from './types';

/** responder 与前景同属玻璃宿主；偏好更新只改变材质，不重挂载按钮内容。 */
export function NativeGlassButton({
  children,
  style,
  contentStyle,
  fallbackColor,
  onTouchStart,
  onPointerDown,
  ...props
}: NativeGlassButtonProps): React.JSX.Element {
  const { scheme } = useTheme();
  const fallback = useGlassFallback();
  const reducedMotion = usePrefersReducedMotion();
  const [pressed, setPressed] = useState(false);
  const interactive = !fallback && !reducedMotion && !props.disabled;
  const opacity = props.disabled
    ? 0.5
    : !interactive && pressed
      ? pressedOpacity
      : 1;

  return (
    <TouchableWithoutFeedback
      {...props}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <LiquidGlassView
        interactive={interactive}
        effect={fallback ? 'none' : 'regular'}
        animated={false}
        colorScheme={scheme}
        onTouchStart={onTouchStart}
        onPointerDown={onPointerDown}
        style={[style, fallback && { backgroundColor: fallbackColor }]}
      >
        <View collapsable={false} style={[contentStyle, { opacity }]}>
          {children}
        </View>
      </LiquidGlassView>
    </TouchableWithoutFeedback>
  );
}
