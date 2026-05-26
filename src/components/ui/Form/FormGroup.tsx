import React from 'react';
import { Text, View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { makeStyles } from './styles';
import type { FormGroupProps } from './types';

/**
 * 白卡片上的分组：分组标题 + 一组行。
 * 组内行之间用 1px 细线分隔（表单是「不用 gap」规则的例外）。
 *
 * **业务约定：** 动态列表（运行时增删 FormRow）必须给每个 child 传稳定 `key` prop。
 * 不传时 fallback 到 `__row-${i}` —— 仅适用于**静态**列表，动态列表会导致 state 漂移。
 */
export function FormGroup({
  label,
  children,
  testID,
}: FormGroupProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  const arr = React.Children.toArray(children);
  return (
    <View style={styles.group} testID={testID}>
      {label ? (
        <Text style={styles.groupLabel} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
      <View style={styles.groupBody}>
        {arr.map((child, i) => {
          const childKey =
            React.isValidElement(child) && child.key != null
              ? child.key
              : `__row-${i}`;
          return (
            <View key={childKey} style={i > 0 ? styles.divider : null}>
              {child}
            </View>
          );
        })}
      </View>
    </View>
  );
}
