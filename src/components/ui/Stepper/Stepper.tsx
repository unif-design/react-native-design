import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { pressedOpacity, useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { childTestID } from '../../../utils/testID';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import { getStepperValueAccessibilityProps } from './accessibility';
import { resolveStepperLayout } from './layout';
import { nextStepperValue, normalizeStepper } from './normalizeStepper';
import { StepperPressable } from './StepperPressable';
import { makeStyles, sizingFor } from './styles';
import type { StepperProps } from './types';

const log = createLogger('Stepper');

// [L-30] 模块级 Set 去重 —— step/min/max 告警只打一次,避免渲染阶段刷屏
const _warned = new Set<string>();

/**
 * 数字步进器 [−][ N ][+]。
 * 按钮自动夹到 min/max；越界的按钮透明度变 0.4。
 *
 * 健壮性：value/min/max 的非法或非有限输入均折叠到安全范围；step <=0 或
 * 非有限数时回退 1；min > max 时折叠为 min 的零范围。
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
  const accessibleName = normalizeNonBlankText(accessibilityLabel);
  const hasBlankLabel = accessibleName === undefined;
  const normalized = normalizeStepper({
    value,
    min,
    max,
    step,
    disabled: disabled === true || hasBlankLabel,
  });
  const { safeMin, safeStep, safeValue, canDecrement, canIncrement } =
    normalized;
  const decrementValue = nextStepperValue(normalized, 'decrement');
  const incrementValue = nextStepperValue(normalized, 'increment');
  const valueAccessibilityProps = getStepperValueAccessibilityProps({
    normalized,
    onChange,
  });

  // [L-30] step 口径对齐:非有限数(NaN/Infinity)也告警,与 min>max 告警保持一致
  // 告警也读取归一化结果,避免提示 fallback 与实际 render/action 使用不同数值。
  const hasInvalidStep = step !== undefined && safeStep !== step;
  const hasInvalidRange =
    min !== undefined &&
    max !== undefined &&
    typeof min === 'number' &&
    Number.isFinite(min) &&
    typeof max === 'number' &&
    Number.isFinite(max) &&
    min > max;

  useEffect(() => {
    if (hasInvalidStep) {
      const k = `step:${String(step)}`;
      if (!_warned.has(k)) {
        _warned.add(k);
        log.warn(
          `step 必须是有限正数，传入 ${String(step)}，已 fallback 为 ${safeStep}`
        );
      }
    }
  }, [hasInvalidStep, safeStep, step]);
  useEffect(() => {
    if (hasInvalidRange) {
      const k = `minmax:${String(min)}:${String(max)}`;
      if (!_warned.has(k)) {
        _warned.add(k);
        log.warn(
          `min(${String(min)}) 不能大于 max(${String(max)})，已折叠为 ${safeMin} 的零范围`
        );
      }
    }
  }, [hasInvalidRange, max, min, safeMin]);
  useEffect(() => {
    if (hasBlankLabel) {
      log.warn('Stepper accessibilityLabel 不能为空白，当前 action 已禁用。');
    }
  }, [hasBlankLabel]);

  const decrementTestID = childTestID(testID, 'decrement');
  const valueTestID = childTestID(testID, 'value');
  const incrementTestID = childTestID(testID, 'increment');

  return (
    <View style={styles.wrap} testID={testID}>
      <StepperPressable
        accessible={!hasBlankLabel}
        onPress={
          decrementValue === undefined
            ? undefined
            : () => onChange(decrementValue)
        }
        disabled={!canDecrement}
        accessibilityRole={hasBlankLabel ? undefined : 'button'}
        accessibilityLabel={
          accessibleName === undefined ? undefined : `${accessibleName}，减少`
        }
        accessibilityState={
          hasBlankLabel ? undefined : { disabled: !canDecrement }
        }
        accessibilityHint={
          hasBlankLabel ? undefined : `当前值 ${safeValue}，减 ${safeStep}`
        }
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
      </StepperPressable>
      <View
        accessible={!hasBlankLabel}
        accessibilityRole={hasBlankLabel ? undefined : 'adjustable'}
        accessibilityLabel={accessibleName}
        {...(hasBlankLabel ? {} : valueAccessibilityProps)}
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
      <StepperPressable
        accessible={!hasBlankLabel}
        onPress={
          incrementValue === undefined
            ? undefined
            : () => onChange(incrementValue)
        }
        disabled={!canIncrement}
        accessibilityRole={hasBlankLabel ? undefined : 'button'}
        accessibilityLabel={
          accessibleName === undefined ? undefined : `${accessibleName}，增加`
        }
        accessibilityState={
          hasBlankLabel ? undefined : { disabled: !canIncrement }
        }
        accessibilityHint={
          hasBlankLabel ? undefined : `当前值 ${safeValue}，加 ${safeStep}`
        }
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
      </StepperPressable>
    </View>
  );
}
