import React, { useContext, useEffect } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  fixed,
  pressedOpacity,
  r,
  space,
  useColors,
  useThemedStyles,
} from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { childTestID } from '../../../utils/testID';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import { RadioContext } from './RadioContext';
import { RadioGroup } from './RadioGroup';
import { makeStyles } from './styles';
import type { RadioProps } from './types';

const log = createLogger('Radio');

// [L-30] 模块级 Set 去重 —— "must be inside Group" 只告警一次,避免 FlatList 滚动时刷屏
const _warnedCtx = new Set<string>();

/**
 * 单个 radio 选项。必须放在 `<Radio.Group>` 里使用。
 */
export function Radio({
  value,
  label,
  accessibilityLabel,
  disabled,
  testID,
}: RadioProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const ctx = useContext(RadioContext);
  const accessibleName =
    normalizeNonBlankText(accessibilityLabel) ?? normalizeNonBlankText(label);
  const hasMissingName = accessibleName === undefined;

  useEffect(() => {
    if (!ctx) {
      const warnKey = `no-ctx:${String(value)}`;
      if (!_warnedCtx.has(warnKey)) {
        _warnedCtx.add(warnKey);
        log.warn('<Radio> must be used inside <Radio.Group>');
      }
    }
  }, [ctx, value]);
  useEffect(() => {
    if (hasMissingName) {
      log.warn(
        'Radio 需要非空的 accessibilityLabel 或可见 label，当前 action 已禁用。'
      );
    }
  }, [hasMissingName]);

  if (!ctx) {
    return <View />;
  }
  const checked = ctx.value === value;
  const isDisabled = disabled === true || hasMissingName;
  // [L-92] 改用 childTestID:收口 parent+id 拼接逻辑,保持空串 override 回落拼接语义
  const resolvedTestID = childTestID(ctx.groupTestID, value, testID);

  // [M-7] row 含 paddingVertical space[2](上下各 ~6pt) → 行高 ≈ r(20) + 2×space[2] ≈ 32pt
  // 补足到 fixed.hitTarget:slop = (44 - 32) / 2 = 6
  const hitSlopV = Math.max(
    0,
    Math.round((fixed.hitTarget - (r(20) + 2 * space[2])) / 2)
  );

  return (
    <Pressable
      accessible={!hasMissingName}
      onPress={isDisabled ? undefined : () => ctx.onChange(value)}
      disabled={isDisabled}
      hitSlop={hitSlopV}
      accessibilityRole={hasMissingName ? undefined : 'radio'}
      accessibilityState={
        hasMissingName ? undefined : { checked, disabled: isDisabled }
      }
      accessibilityLabel={accessibleName}
      testID={resolvedTestID}
      style={({ pressed }) => [
        styles.row,
        { opacity: isDisabled ? 0.5 : pressed ? pressedOpacity : 1 },
      ]}
    >
      <View
        {...A11Y_HIDDEN_PROPS}
        style={[styles.circle, checked && { borderColor: c.primary }]}
      >
        {checked ? <View style={styles.dot} /> : null}
      </View>
      {label ? (
        <Text {...A11Y_HIDDEN_PROPS} style={styles.label}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

Radio.Group = RadioGroup;
