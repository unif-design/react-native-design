import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { makeStyles, sizingFor } from './styles';
import type { StepperProps } from './types';

const log = createLogger('Stepper');

/**
 * 数字步进器 [−][ N ][+]。
 * 按钮自动夹到 min/max；越界的按钮透明度变 0.4。
 *
 * 健壮性：value 为 NaN/Infinity 时显示为 min；step <=0 或非有限数时回退 1；
 * min > max 时整体按 min（避免 onChange 写出乱序值）。
 */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  size = 'md',
  disabled = false,
  testID,
}: StepperProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  const dims = sizingFor(size);

  if (Number.isFinite(step) && step <= 0) {
    log.warn(`step 必须是正数，传入 ${step}，已 fallback 为 1`);
  }
  if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
    log.warn(`min(${min}) 不能大于 max(${max})，已按 min 渲染`);
  }
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max >= safeMin ? max : safeMin;
  // value 处理:NaN → min;±Infinity → 钳到 [min, max];有限数 → 正常 clamp
  const safeValue = Number.isNaN(value)
    ? safeMin
    : Math.min(safeMax, Math.max(safeMin, value));
  const decDisabled = disabled || safeValue <= safeMin;
  const incDisabled = disabled || safeValue >= safeMax;

  return (
    <View style={styles.wrap} testID={testID}>
      <Pressable
        onPress={() => onChange(Math.max(safeMin, safeValue - safeStep))}
        disabled={decDisabled}
        accessibilityRole="button"
        accessibilityLabel="减少"
        accessibilityState={{ disabled: decDisabled }}
        accessibilityHint={`当前值 ${safeValue}，减 ${safeStep}`}
        testID={testID ? `${testID}-decrement` : undefined}
        style={({ pressed }) => [
          styles.cell,
          styles.btnLeft,
          { width: dims.btn, height: dims.h },
          { opacity: decDisabled ? 0.4 : pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <View
        accessibilityRole="adjustable"
        accessibilityValue={{ min: safeMin, max: safeMax, now: safeValue }}
        style={[styles.cell, { minWidth: dims.w, height: dims.h }]}
        testID={testID ? `${testID}-value` : undefined}
      >
        <Text style={[styles.valueText, { fontSize: dims.fs }]}>
          {safeValue}
        </Text>
      </View>
      <Pressable
        onPress={() => onChange(Math.min(safeMax, safeValue + safeStep))}
        disabled={incDisabled}
        accessibilityRole="button"
        accessibilityLabel="增加"
        accessibilityState={{ disabled: incDisabled }}
        accessibilityHint={`当前值 ${safeValue}，加 ${safeStep}`}
        testID={testID ? `${testID}-increment` : undefined}
        style={({ pressed }) => [
          styles.cell,
          styles.btnRight,
          { width: dims.btn, height: dims.h },
          { opacity: incDisabled ? 0.4 : pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}
