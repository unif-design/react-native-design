import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Button,
  ShimmerText,
  type ColorTokens,
  usePrefersReducedMotion,
  useThemedStyles,
} from '@unif/react-native-design';

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    stack: { gap: 18 },
    preview: {
      gap: 20,
      padding: 20,
      borderRadius: 12,
      backgroundColor: colors.surfaceContainer,
      maxWidth: 560,
      width: '100%',
    },
    text: { color: colors.foregroundMuted, fontSize: 16, lineHeight: 24 },
    controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    hint: { color: colors.foregroundMuted, fontSize: 13 },
  });

export function ShimmerTextDemo() {
  const [active, setActive] = useState(true);
  const [alternate, setAlternate] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.stack}>
      <View style={styles.preview}>
        <ShimmerText active={active} style={styles.text} testID="shimmer-short">
          {alternate ? '正在准备回复' : '正在思考中'}
        </ShimmerText>
        <ShimmerText active={active} style={styles.text} testID="shimmer-long">
          正在整理已收到的信息，请稍候；较长的中文仍按原来的文字样式和可用宽度展示。
        </ShimmerText>
      </View>
      <View style={styles.controls}>
        <Button
          label={active ? '停用扫光' : '启用扫光'}
          variant="secondary"
          onPress={() => setActive(!active)}
        />
        <Button
          label="替换第一行文字"
          variant="secondary"
          onPress={() => setAlternate(!alternate)}
        />
      </View>
      <Text style={styles.hint}>
        {reducedMotion
          ? '系统已减少动态效果，当前显示静态文字。'
          : active
            ? '每四秒扫光一次。'
            : '扫光已停用，文字保持原色。'}
      </Text>
    </View>
  );
}
