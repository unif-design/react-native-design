import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useColors, useThemedStyles } from '../../../theme';
import { makeStyles, paletteFor, sizingFor } from './styles';
import type {
  ButtonBaseRenderContext,
  ButtonSize,
  ButtonVariant,
} from './types';

export type ButtonBaseProps = {
  onPress?: () => void;
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  /** 方形约束 — width=height=sizing.h,优先级高于 horizontal padding。IconButton 用。 */
  square?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  /** SR 朗读 label 后的行为说明 hint。仅在"行为不显然"时加。 */
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** 强制函数形态 — 消费者通过 ctx.sizing / ctx.palette 渲染内容,
   *  sizing / palette 在 ButtonBase 内单点计算。 */
  children: (ctx: ButtonBaseRenderContext) => React.ReactNode;
};

/** ButtonBase —— Button / IconButton 共享的 internal primitive。
 *  职责:Pressable / sizing / palette / 视觉态 / a11y / text variant 特殊处理 /
 *  block / square。children 强制 render prop,sizingFor / paletteFor 在 styles.ts。 */
export function ButtonBase({
  onPress,
  size = 'md',
  variant = 'primary',
  disabled,
  loading,
  block,
  square,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityHint,
  style,
  testID,
  children,
}: ButtonBaseProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);

  const sizing = useMemo(() => sizingFor(size), [size]);
  const palette = useMemo(() => paletteFor(variant, c), [variant, c]);

  const isText = variant === 'text';
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !isInteractive }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      disabled={!isInteractive}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          // text variant 撕掉所有 chrome,只剩 inline 文字
          height: isText ? undefined : sizing.h,
          // square 时方形:width=height,horizontal padding=0
          width: square ? sizing.h : undefined,
          paddingHorizontal: isText || square ? 0 : sizing.px,
          borderRadius: sizing.br,
          backgroundColor: palette.bg,
          borderColor: palette.border ?? 'transparent',
          borderWidth: palette.border ? 1 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
          alignSelf: block ? 'stretch' : 'flex-start',
          flexGrow: block ? 1 : 0,
          gap: sizing.gap,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        children({ sizing, palette })
      )}
    </Pressable>
  );
}
