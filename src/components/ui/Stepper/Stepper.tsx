import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { pressedOpacity, useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { childTestID } from '../../../utils/testID';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { resolveStepperLayout } from './layout';
import { nextStepperValue, normalizeStepper } from './normalizeStepper';
import { makeStyles, sizingFor } from './styles';
import type { StepperProps } from './types';

const log = createLogger('Stepper');

// [L-30] 模块级 Set 去重 —— step/min/max 告警只打一次,避免渲染阶段刷屏
const _warned = new Set<string>();

/**
 * 数字步进器 [−][ N ][+]。
 * 按钮自动夹到 min/max；越界的按钮透明度变 0.4。
 *
 * 健壮性：value 为 NaN 时使用 min，±Infinity 钳到边界；step <=0 或非有限数
 * 时回退 1；min > max 时折叠为 min 的零范围。
 */
export function Stepper({
  value,
  onChange,
  accessibilityLabel,
  min,
  max,
  step,
  size = 'md',
  disabled = false,
  testID,
}: StepperProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  const dims = sizingFor(size);
  const layout = resolveStepperLayout(dims);
  const normalized = normalizeStepper({
    value,
    min,
    max,
    step,
    disabled,
  });
  const {
    safeMin,
    safeMax,
    safeStep,
    safeValue,
    rangeDisabled,
    canDecrement,
    canIncrement,
    accessibilityActions,
  } = normalized;
  const decrementValue = nextStepperValue(normalized, 'decrement');
  const incrementValue = nextStepperValue(normalized, 'increment');

  // [L-30] step 口径对齐:非有限数(NaN/Infinity)也告警,与 min>max 告警保持一致
  // 告警也读取归一化结果,避免提示 fallback 与实际 render/action 使用不同数值。
  if (step !== undefined && safeStep !== step) {
    const k = `step:${step}`;
    if (!_warned.has(k)) {
      _warned.add(k);
      log.warn(`step 必须是有限正数，传入 ${step}，已 fallback 为 ${safeStep}`);
    }
  }
  if (
    min !== undefined &&
    max !== undefined &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    min > max
  ) {
    const k = `minmax:${min}:${max}`;
    if (!_warned.has(k)) {
      _warned.add(k);
      log.warn(
        `min(${min}) 不能大于 max(${max})，已折叠为 ${safeMin} 的零范围`
      );
    }
  }
  const decrementTestID = childTestID(testID, 'decrement');
  const valueTestID = childTestID(testID, 'value');
  const incrementTestID = childTestID(testID, 'increment');

  return (
    <View style={styles.wrap} testID={testID}>
      <Pressable
        onPress={
          decrementValue === undefined
            ? undefined
            : () => onChange(decrementValue)
        }
        disabled={!canDecrement}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}，减少`}
        accessibilityState={{ disabled: !canDecrement }}
        accessibilityHint={`当前值 ${safeValue}，减 ${safeStep}`}
        testID={decrementTestID}
        style={({ pressed }) => [
          styles.actionFrame,
          layout.decrementFrame,
          {
            opacity: !canDecrement ? 0.4 : pressed ? pressedOpacity : 1,
          },
        ]}
      >
        <View
          {...A11Y_HIDDEN_PROPS}
          style={[
            styles.cell,
            styles.btnLeft,
            { width: dims.btn, height: dims.h },
          ]}
          testID={childTestID(testID, 'decrement-visual')}
        >
          <Text style={styles.btnText}>−</Text>
        </View>
      </Pressable>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: rangeDisabled }}
        accessibilityValue={{ min: safeMin, max: safeMax, now: safeValue }}
        accessibilityActions={rangeDisabled ? undefined : accessibilityActions}
        onAccessibilityAction={
          rangeDisabled
            ? undefined
            : (event) => {
                if (
                  event.nativeEvent.actionName === 'increment' &&
                  incrementValue !== undefined
                ) {
                  onChange(incrementValue);
                } else if (
                  event.nativeEvent.actionName === 'decrement' &&
                  decrementValue !== undefined
                ) {
                  onChange(decrementValue);
                }
              }
        }
        style={[styles.valueFrame, layout.valueFrame]}
        testID={valueTestID}
      >
        <View
          {...A11Y_HIDDEN_PROPS}
          style={[styles.cell, { width: dims.w, height: dims.h }]}
          testID={childTestID(testID, 'value-visual')}
        >
          <Text style={[styles.valueText, { fontSize: dims.fs }]}>
            {safeValue}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={
          incrementValue === undefined
            ? undefined
            : () => onChange(incrementValue)
        }
        disabled={!canIncrement}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}，增加`}
        accessibilityState={{ disabled: !canIncrement }}
        accessibilityHint={`当前值 ${safeValue}，加 ${safeStep}`}
        testID={incrementTestID}
        style={({ pressed }) => [
          styles.actionFrame,
          layout.incrementFrame,
          {
            opacity: !canIncrement ? 0.4 : pressed ? pressedOpacity : 1,
          },
        ]}
      >
        <View
          {...A11Y_HIDDEN_PROPS}
          style={[
            styles.cell,
            styles.btnRight,
            { width: dims.btn, height: dims.h },
          ]}
          testID={childTestID(testID, 'increment-visual')}
        >
          <Text style={styles.btnText}>+</Text>
        </View>
      </Pressable>
    </View>
  );
}
