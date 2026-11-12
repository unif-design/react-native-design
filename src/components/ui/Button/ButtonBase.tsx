import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
  type ViewProps,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { isLiquidGlassSupported } from '@callstack/liquid-glass';
import {
  fixed,
  pressedOpacity,
  radius,
  useColors,
  useMotionActive,
  useThemedStyles,
} from '../../../theme';
import { GlassLayer } from '../GlassLayer';
import { NativeGlassButton } from './NativeGlassButton';
import { makeStyles, paletteFor, sizingFor } from './styles';
import type {
  ButtonBaseRenderContext,
  ButtonSize,
  ButtonVariant,
} from './types';

export type ButtonBaseProps = {
  buttonRef?: React.ComponentProps<typeof Pressable>['ref'];
  onPress: () => void;
  onTouchStart?: ViewProps['onTouchStart'];
  onPointerDown?: ViewProps['onPointerDown'];
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** 加载时保留内容；忙碌状态和禁用保护仍由 loading 控制。 */
  showContentWhenLoading?: boolean;
  block?: boolean;
  /** 方形约束 — width=height=sizing.h,优先级高于 horizontal padding。IconButton 用。 */
  square?: boolean;
  iconButton?: boolean;
  surfaceSize?: number;
  loadingSize?: number;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  /** SR 朗读 label 后的行为说明 hint。仅在"行为不显然"时加。 */
  accessibilityHint?: string;
  /** 调用方附加状态；disabled / busy 由内部状态机控制，不能被覆盖。 */
  accessibilityState?: Omit<AccessibilityState, 'disabled' | 'busy'>;
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
  buttonRef,
  onPress,
  onTouchStart,
  onPointerDown,
  size = 'md',
  variant = 'primary',
  disabled,
  loading,
  showContentWhenLoading,
  block,
  square,
  iconButton,
  surfaceSize,
  loadingSize,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityHint,
  accessibilityState,
  style,
  testID,
  children,
}: ButtonBaseProps): React.JSX.Element {
  const c = useColors();
  const motionActive = useMotionActive();
  const styles = useThemedStyles(makeStyles);

  const sizing = useMemo(() => {
    const base = sizingFor(size);
    return surfaceSize !== undefined ? { ...base, h: surfaceSize } : base;
  }, [size, surfaceSize]);
  const palette = useMemo(() => paletteFor(variant, c), [variant, c]);

  const isText = variant === 'text';
  const isGlass = variant === 'glass' || variant === 'secondary';
  const glassRadius =
    StyleSheet.flatten(style)?.borderRadius ??
    (variant === 'glass' ? radius.pill : sizing.br);
  const unavailable = disabled === true || loading === true;
  const hasAccessibleName = accessibilityLabel !== undefined;
  const effectiveAccessibilityState = hasAccessibleName
    ? { ...accessibilityState, disabled: unavailable, busy: loading === true }
    : undefined;

  // [M-7] 触控目标补偿:hitSlop 向外扩展命中区域到 fixed.hitTarget(44pt)。
  // 公式:vertical slop = max(0, (hitTarget - h) / 2);square 时同补 horizontal。
  // text variant height=undefined(仅行内文字高 ~18pt),无法从 sizing.h 推算,
  // 保守固定补到 44pt 等效(top+bottom ≈ 13pt each)。
  // ⚠ hitSlop 不越父边界;相邻可按压元素建议间距 ≥ 2×slop 以防重叠裁决。
  const hitSlop = useMemo(() => {
    if (isText) {
      // text 无 chrome,仅靠行高无法可靠获取实际高度,固定补至 44pt
      const v = Math.round((fixed.hitTarget - 18) / 2);
      return { top: v, bottom: v, left: 0, right: 0 };
    }
    const v = Math.max(0, Math.round((fixed.hitTarget - sizing.h) / 2));
    if (square) {
      return { top: v, bottom: v, left: v, right: v };
    }
    return { top: v, bottom: v, left: 0, right: 0 };
  }, [isText, sizing.h, square]);

  const content =
    loading && !showContentWhenLoading ? (
      <ActivityIndicator
        size={loadingSize ?? 'small'}
        color={palette.fg}
        animating={motionActive}
        hidesWhenStopped={false}
      />
    ) : (
      children({ sizing, palette })
    );

  const interactionProps = {
    'accessible': hasAccessibleName,
    'accessibilityRole': hasAccessibleName ? accessibilityRole : undefined,
    'accessibilityState': effectiveAccessibilityState,
    'aria-disabled': effectiveAccessibilityState?.disabled,
    'aria-busy': effectiveAccessibilityState?.busy,
    'aria-selected': effectiveAccessibilityState?.selected,
    'aria-checked': effectiveAccessibilityState?.checked,
    'aria-expanded': effectiveAccessibilityState?.expanded,
    accessibilityLabel,
    accessibilityHint,
    'disabled': unavailable,
    'onPress': unavailable ? undefined : onPress,
    hitSlop,
    testID,
  };
  const buttonStyle = (pressed: boolean): StyleProp<ViewStyle> => [
    styles.base,
    {
      // text variant 撕掉所有 chrome,只剩 inline 文字
      height: isText ? undefined : sizing.h,
      // square 时方形:width=height,horizontal padding=0
      width: square ? sizing.h : undefined,
      paddingHorizontal: isText || square ? 0 : sizing.px,
      borderRadius: isGlass ? glassRadius : sizing.br,
      backgroundColor: palette.bg,
      borderColor: palette.border ?? 'transparent',
      borderWidth: palette.border ? 1 : 0,
      opacity: isGlass ? 1 : unavailable ? 0.5 : pressed ? pressedOpacity : 1,
      alignSelf: block ? 'stretch' : 'flex-start',
      gap: sizing.gap,
    },
    style,
  ];

  if (isGlass && isLiquidGlassSupported && Platform.OS === 'ios') {
    return (
      <NativeGlassButton
        {...interactionProps}
        onTouchStart={onTouchStart}
        onPointerDown={onPointerDown}
        style={buttonStyle(false)}
        contentStyle={[styles.base, { gap: sizing.gap }]}
        fallbackColor={
          iconButton || variant === 'secondary'
            ? c.surfaceContainerHigh
            : c.surface
        }
      >
        {content}
      </NativeGlassButton>
    );
  }

  return (
    <Pressable
      {...interactionProps}
      ref={buttonRef}
      role={
        hasAccessibleName && accessibilityRole === 'button'
          ? 'button'
          : undefined
      }
      onTouchStart={onTouchStart}
      onPointerDown={onPointerDown}
      style={({ pressed }) => buttonStyle(pressed)}
    >
      {isGlass
        ? ({ pressed }) => {
            const opacity = unavailable ? 0.5 : pressed ? pressedOpacity : 1;
            return (
              <>
                <GlassLayer
                  style={{ borderRadius: glassRadius }}
                  fallbackColor={
                    iconButton
                      ? Platform.OS === 'web'
                        ? c.surfaceContainerHighest
                        : c.surfaceContainerHigh
                      : variant === 'secondary'
                        ? c.surfaceContainerHigh
                        : undefined
                  }
                />
                {/* 原生材质的祖先不能降低 alpha，只淡化按钮前景。 */}
                <View
                  collapsable={false}
                  style={[styles.base, { gap: sizing.gap, opacity }]}
                >
                  {content}
                </View>
              </>
            );
          }
        : content}
    </Pressable>
  );
}
