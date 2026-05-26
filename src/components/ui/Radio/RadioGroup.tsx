import React from 'react';
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
  return (
    <RadioContext.Provider value={{ value, onChange, groupTestID: testID }}>
      <View style={styles.group} testID={testID}>
        {children}
      </View>
    </RadioContext.Provider>
  );
}
