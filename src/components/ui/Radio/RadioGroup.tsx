import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { RadioContext } from './RadioContext';
import { makeStyles } from './styles';
import type { GroupProps } from './types';

/**
 * Radio 组 —— 单选。把若干 `<Radio>` 作为 children 放进来。
 *
 * <Radio.Group value={tier} onChange={setTier}>
 *   <Radio value="vip"     label="VIP 客户" />
 *   <Radio value="normal"  label="普通客户" />
 * </Radio.Group>
 */
export function RadioGroup({
  value,
  onChange,
  children,
  testID,
}: GroupProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  // [L-80b] useMemo 稳定 context value —— 避免每次渲染都产生新对象引用,
  // 防止所有 Radio 子项因 context 变化而不必要 re-render。
  const ctx = useMemo(
    () => ({ value, onChange, groupTestID: testID }),
    [value, onChange, testID]
  );
  return (
    <RadioContext.Provider value={ctx}>
      {/* [L-34] accessibilityRole="radiogroup" —— SR 宣读"单选按钮组" */}
      <View style={styles.group} testID={testID} accessibilityRole="radiogroup">
        {children}
      </View>
    </RadioContext.Provider>
  );
}
