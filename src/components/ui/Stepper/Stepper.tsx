import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { pressedOpacity, useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { childTestID } from '../../../utils/testID';
import { makeStyles, sizingFor } from './styles';
import type { StepperProps } from './types';

const log = createLogger('Stepper');

// [L-30] 模块级 Set 去重 —— step/min/max 告警只打一次,避免渲染阶段刷屏
const _warned = new Set<string>();

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

  // [L-30] step 口径对齐:非有限数(NaN/Infinity)也告警,与 min>max 告警保持一致
  // 模块级 Set 去重:每个异常组合只打一次告警,避免渲染阶段重复刷屏
  if (!Number.isFinite(step) || step <= 0) {
    const k = `step:${step}`;
    if (!_warned.has(k)) {
      _warned.add(k);
      log.warn(`step 必须是有限正数，传入 ${step}，已 fallback 为 1`);
    }
  }
  if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
    const k = `minmax:${min}:${max}`;
    if (!_warned.has(k)) {
      _warned.add(k);
      log.warn(`min(${min}) 不能大于 max(${max})，已按 min 渲染`);
    }
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
        testID={childTestID(testID, 'decrement')}
        style={({ pressed }) => [
          styles.cell,
          styles.btnLeft,
          { width: dims.btn, height: dims.h },
          { opacity: decDisabled ? 0.4 : pressed ? pressedOpacity : 1 },
        ]}
      >
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      {/* [L-29] adjustable 需配 accessible + accessibilityActions + onAccessibilityAction,
          否则 iOS VoiceOver 宣读"可调节"但滑动手势无响应。*/}
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityValue={{ min: safeMin, max: safeMax, now: safeValue }}
        accessibilityActions={[
          { name: 'increment', label: '增加' },
          { name: 'decrement', label: '减少' },
        ]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment' && !incDisabled) {
            onChange(Math.min(safeMax, safeValue + safeStep));
          } else if (e.nativeEvent.actionName === 'decrement' && !decDisabled) {
            onChange(Math.max(safeMin, safeValue - safeStep));
          }
        }}
        style={[styles.cell, { minWidth: dims.w, height: dims.h }]}
        testID={childTestID(testID, 'value')}
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
        testID={childTestID(testID, 'increment')}
        style={({ pressed }) => [
          styles.cell,
          styles.btnRight,
          { width: dims.btn, height: dims.h },
          { opacity: incDisabled ? 0.4 : pressed ? pressedOpacity : 1 },
        ]}
      >
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}
