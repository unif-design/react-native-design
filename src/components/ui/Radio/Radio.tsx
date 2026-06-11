import React, { useContext } from 'react';
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
  disabled,
  testID,
}: RadioProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const ctx = useContext(RadioContext);
  if (!ctx) {
    // [L-30] 去重:同一 value 的 warn 只打一次,避免渲染阶段反复刷屏
    const warnKey = `no-ctx:${String(value)}`;
    if (!_warnedCtx.has(warnKey)) {
      _warnedCtx.add(warnKey);
      log.warn('<Radio> must be used inside <Radio.Group>');
    }
    return <View />;
  }
  const checked = ctx.value === value;
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
      onPress={() => !disabled && ctx.onChange(value)}
      disabled={disabled}
      hitSlop={hitSlopV}
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={label}
      testID={resolvedTestID}
      style={({ pressed }) => [
        styles.row,
        { opacity: disabled ? 0.5 : pressed ? pressedOpacity : 1 },
      ]}
    >
      <View style={[styles.circle, checked && { borderColor: c.primary }]}>
        {checked ? <View style={styles.dot} /> : null}
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

Radio.Group = RadioGroup;
