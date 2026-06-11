import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { pressedOpacity, useColors, useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
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
  const resolvedTestID =
    testID ?? (ctx.groupTestID ? `${ctx.groupTestID}-${value}` : undefined);

  return (
    <Pressable
      onPress={() => !disabled && ctx.onChange(value)}
      disabled={disabled}
      hitSlop={4}
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
