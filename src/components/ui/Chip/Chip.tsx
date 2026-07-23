import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  fixed,
  pressedOpacity,
  r,
  rf,
  useColors,
  useThemedStyles,
} from '../../../theme';
import { Spinner } from '../Spinner';
import { makeStyles } from './styles';
import type { ChipProps } from './types';

/** 处理中 chip 的透明度 —— 比 disabled(0.5)亮、比按下(pressedOpacity)暗:
 *  「正在办」既要压下去,又不能和「不能点」长一样(那两者只靠 spinner 区分就太弱了)。 */
const busyOpacity = 0.6;
/** busy spinner 直径 —— 与调用方常用的 leading icon(12)等大,顶替时不改 chip 宽度。 */
const busySpinner = r(12);

/**
 * 胶囊形可点击 chip。
 * - 默认：surface 底 + outline 细线边框，foreground 文本
 * - 选中：主色边框 + 主色文本
 * - 按下：透明度 pressedOpacity(与 ButtonBase 同源)
 * - 禁用：透明度 0.5 + 不响应 onPress
 * - 处理中(`busy`)：leading 换 spinner + 透明度 0.6 + 不响应二次点击
 *
 * 常用于建议 chip、筛选 pill、多选标签等。
 */
export function Chip({
  label,
  selected,
  onPress,
  disabled,
  busy,
  leading,
  trailing,
  style,
  testID,
}: ChipProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  // 处理中把 spinner 放进 leading 位(有 leading 就顶掉它):label 必须留着 —— 换掉它 chip
  // 会塌成一个圆点,同排 chip 集体重排。spinner 跟随文本色,不在未选中的 chip 上凭空冒主色。
  const lead = busy ? (
    <Spinner
      size={busySpinner}
      thickness={r(1.5)}
      color={selected ? c.primary : c.foreground}
    />
  ) : (
    leading
  );
  const inner = (
    <View
      style={[styles.chip, selected && styles.chipOn, style]}
      testID={onPress ? undefined : testID}
    >
      {lead != null ? <View>{lead}</View> : null}
      <Text style={[styles.text, selected && styles.textOn]} numberOfLines={1}>
        {label}
      </Text>
      {trailing != null ? <View>{trailing}</View> : null}
    </View>
  );

  if (onPress) {
    // [M-7] chip 内容高 ≈ 2×space[3] + xs 行高 ≈ 34pt < 44pt
    // Pressable 是外壳,hitSlop 向外补足到 fixed.hitTarget
    const chipHitSlopV = Math.max(
      0,
      Math.round((fixed.hitTarget - (2 * r(8) + rf(13) * 1.4)) / 2)
    );
    // 处理中同样不响应:chip 的高频用法是「点一下发起一次请求」,放行二次点击就是重复提交。
    const inactive = !!disabled || !!busy;
    return (
      <Pressable
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityState={{
          selected: !!selected,
          disabled: inactive,
          busy: !!busy,
        }}
        accessibilityLabel={label}
        testID={testID}
        hitSlop={{ top: chipHitSlopV, bottom: chipHitSlopV, left: 0, right: 0 }}
        style={({ pressed }) => [
          {
            alignSelf: 'flex-start',
            opacity: disabled
              ? 0.5
              : busy
                ? busyOpacity
                : pressed
                  ? pressedOpacity
                  : 1,
          },
        ]}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}
