import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { r, radius, useThemedStyles } from '../../../theme';
import { GlassLayer } from '../GlassLayer';
import { GlassGroup } from '../GlassLayer/GlassGroup';
import { makeStyles } from './styles';
import type { ActionMenuPopoverCardProps } from './types';

export function ActionMenuPopoverCard({
  children,
  pointer,
  style,
  contentStyle,
  testID,
}: ActionMenuPopoverCardProps) {
  const styles = useThemedStyles(makeStyles);
  const [width, setWidth] = useState(0);
  const pointerWidth = Math.min(r(26), width);
  const pointerHeight = (pointerWidth * 14) / 26;
  const half = pointerWidth / 2;
  // Web 没有 SDK 材质融合，箭头恰好接边，避免重复叠色形成亮缝。
  const overlap = Platform.OS === 'web' ? 0 : r(1);
  const inset = Math.min(radius['3xl'] + half, width / 2);
  const offset =
    pointer && Number.isFinite(pointer.offset)
      ? Math.max(inset, Math.min(pointer.offset, width - inset))
      : width / 2;
  return (
    <View
      testID={testID}
      style={[styles.popoverRoot, style]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <GlassGroup
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {pointer && width > 0 ? (
          <View
            testID={`${testID}-pointer-${pointer.edge}`}
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.pointer,
              {
                left: offset - half,
                width: pointerWidth,
                height: pointerHeight,
              },
              pointer.edge === 'top'
                ? { top: -pointerHeight + overlap }
                : {
                    bottom: -pointerHeight + overlap,
                    transform: [{ rotate: '180deg' }],
                  },
            ]}
          >
            <GlassLayer
              style={{
                width: pointerWidth / Math.SQRT2,
                height: pointerWidth / Math.SQRT2,
                left: (pointerWidth - pointerWidth / Math.SQRT2) / 2,
                top: pointerHeight - pointerWidth / Math.SQRT2 / 2,
                right: undefined,
                bottom: undefined,
                borderRadius: r(2),
                transform: [{ rotate: '45deg' }],
              }}
            />
          </View>
        ) : null}
        <GlassLayer style={styles.popoverMaterial} />
      </GlassGroup>
      <View
        testID={`${testID}-card`}
        style={[styles.popoverCard, contentStyle]}
      >
        {children}
      </View>
    </View>
  );
}
