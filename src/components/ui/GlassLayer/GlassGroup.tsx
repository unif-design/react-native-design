import {
  LiquidGlassContainerView,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import { StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '../../../theme';

export function GlassGroup({ children, ...props }: ViewProps) {
  const { scheme } = useTheme();
  return (
    // SDK 容器没有 colorScheme；无材质父视图只传递原生外观，避免组沿用系统亮色。
    <LiquidGlassView
      {...props}
      effect="none"
      colorScheme={scheme}
      animated={false}
    >
      <LiquidGlassContainerView style={StyleSheet.absoluteFill}>
        {children}
      </LiquidGlassContainerView>
    </LiquidGlassView>
  );
}
