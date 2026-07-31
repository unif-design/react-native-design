import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  fixed,
  pressedOpacity,
  useColors,
  useThemedStyles,
} from '../../../theme';
import { makeStyles, paletteFor, sizingFor } from './styles';
import type {
  ButtonBaseRenderContext,
  ButtonSize,
  ButtonVariant,
} from './types';

export type ButtonBaseProps = {
  onPress: () => void;
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
  accessibilityState,
  style,
  testID,
  children,
}: ButtonBaseProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);

  const sizing = useMemo(() => sizingFor(size), [size]);
  const palette = useMemo(() => paletteFor(variant, c), [variant, c]);

  const isText = variant === 'text';
  const unavailable = disabled === true || loading === true;

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

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        ...accessibilityState,
        disabled: unavailable,
        busy: loading === true,
      }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      disabled={unavailable}
      onPress={unavailable ? undefined : onPress}
      hitSlop={hitSlop}
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
          opacity: unavailable ? 0.5 : pressed ? pressedOpacity : 1,
          alignSelf: block ? 'stretch' : 'flex-start',
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
