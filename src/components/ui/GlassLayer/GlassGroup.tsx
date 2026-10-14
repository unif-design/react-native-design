import {
  LiquidGlassContainerView,
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '../../../theme';

export function GlassGroup({ children, ...props }: ViewProps) {
  const { scheme } = useTheme();
  // 旧系统没有材质融合，普通容器允许箭头绘制到卡片外。
  if (!isLiquidGlassSupported) return <View {...props}>{children}</View>;
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
