import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, LinearProgress, useColors } from '@unif/react-native-design';

const styles = StyleSheet.create({
  stack: { gap: 20, width: '100%' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

export function LinearProgressDemo() {
  const [value, setValue] = useState(0.42);
  const colors = useColors();
  return (
    <View style={styles.stack}>
      <LinearProgress value={value} accessibilityLabel="页面加载进度" />
      <Text style={{ color: colors.foreground }}>
        当前进度：{Math.round(value * 100)}%
      </Text>
      <View style={styles.controls}>
        <Button label="重置" onPress={() => setValue(0)} />
        <Button label="设为 42%" onPress={() => setValue(0.42)} />
        <Button label="完成" onPress={() => setValue(1)} />
      </View>
    </View>
  );
}
