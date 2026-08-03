import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import { RadioContext } from './RadioContext';
import { makeStyles } from './styles';
import type { GroupProps } from './types';

const log = createLogger('Radio.Group');

/**
 * Radio 组 —— 单选。把若干 `<Radio>` 作为 children 放进来。
 *
 * <Radio.Group value={tier} onChange={setTier} accessibilityLabel="客户等级">
 *   <Radio value="vip"     label="VIP 客户" />
 *   <Radio value="normal"  label="普通客户" />
 * </Radio.Group>
 */
export function RadioGroup({
  value,
  onChange,
  accessibilityLabel,
  children,
  testID,
}: GroupProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  const accessibleName = normalizeNonBlankText(accessibilityLabel);
  const hasBlankLabel = accessibleName === undefined;
  // [L-80b] useMemo 稳定 context value —— 避免每次渲染都产生新对象引用,
  // 防止所有 Radio 子项因 context 变化而不必要 re-render。
  const ctx = useMemo(
    () => ({ value, onChange, groupTestID: testID }),
    [value, onChange, testID]
  );
  useEffect(() => {
    if (hasBlankLabel) {
      log.warn('Radio.Group accessibilityLabel 不能为空白。');
    }
  }, [hasBlankLabel]);

  return (
    <RadioContext.Provider value={ctx}>
      {/* [L-34] accessibilityRole="radiogroup" —— SR 宣读"单选按钮组" */}
      <View
        style={styles.group}
        testID={testID}
        accessibilityRole="radiogroup"
        accessibilityLabel={accessibleName}
      >
        {children}
      </View>
    </RadioContext.Provider>
  );
}
