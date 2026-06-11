import React from 'react';
import { Text, View } from 'react-native';
import { BlurLayer } from '../../ui/BlurLayer';
import { useThemedStyles } from '../../../theme';
import { makeGlassStatsStyles } from './styles';
import type { GlassStatsProps } from './types';

/**
 * 玻璃数据条 —— BlurLayer 真 backdrop blur + 内部 N 列数据。
 *
 * BlurLayer 接管 backdrop 双层结构(BlurView soft + glassTintLight tint),
 * blurType 跟 scheme 自动切。
 */
export function GlassStats({ items }: GlassStatsProps): React.JSX.Element {
  const styles = useThemedStyles(makeGlassStatsStyles);
  return (
    // 外层 shell 承担 shadow(无 overflow,iOS Core Animation masksToBounds=true
    // 会裁掉 outer shadow);内层 glass 承担 overflow:hidden + border 裁圆角。
    // 单层 overflow + shadow 在 iOS 上 shadow 完全不可见。
    <View style={styles.glassShell}>
      <View style={styles.glass}>
        <BlurLayer intensity="soft" />
        {/* 顶部 1px inset 白高光,让数据条顶部"凸起" */}
        <View style={styles.topHighlight} pointerEvents="none" />
        <View style={styles.inner}>
          {items.map(([count, label], i) => (
            <React.Fragment key={`${label}-${i}`}>
              {i > 0 ? <View style={styles.sep} /> : null}
              <View style={styles.col}>
                <Text style={styles.countText}>{count}</Text>
                <Text style={styles.labelText}>{label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
}
