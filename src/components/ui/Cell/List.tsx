import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { ListVariantContext } from './context';
import { makeStyles } from './styles';
import type { ListProps } from './types';

/**
 * Cell 的分组容器。
 *
 * - 默认 `grouped` = 灰底排列白卡片,间距 8px
 * - `flush=true` = 嵌在外层 Card 内,紧凑列表;`divider="full"` 铺满全宽 hairline / `"none"` 无分隔线
 */
export function List({
  children,
  flush,
  divider = 'full',
  style,
  testID,
}: ListProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  if (flush) {
    const items = React.Children.toArray(children).filter(Boolean);
    return (
      <ListVariantContext.Provider value="flush">
        <View style={[styles.listFlush, style]} testID={testID}>
          {items.map((child, i) => {
            // 优先使用 caller 传入的 key(React.Children.toArray 已将 key 注入 child)，
            // 回退到索引确保 reconciler 稳定 —— 避免 caller key 丢失导致不必要重挂载。
            const key =
              React.isValidElement(child) && child.key != null ? child.key : i;
            return (
              <React.Fragment key={key}>
                {i > 0 && divider === 'full' ? (
                  <View style={styles.separator} />
                ) : null}
                {child}
              </React.Fragment>
            );
          })}
        </View>
      </ListVariantContext.Provider>
    );
  }
  return (
    <ListVariantContext.Provider value="grouped">
      <View style={[styles.list, styles.listGrouped, style]} testID={testID}>
        {children}
      </View>
    </ListVariantContext.Provider>
  );
}
