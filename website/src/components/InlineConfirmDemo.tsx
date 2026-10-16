import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrashOutlined } from '@unif/react-native-icons';
import {
  Button,
  IconButton,
  InlineConfirmScope,
  type ColorTokens,
  useThemedStyles,
  useColors,
} from '@unif/react-native-design';

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    region: { gap: 20, padding: 16 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
    },
    text: { color: colors.foreground, fontSize: 15 },
    result: { color: colors.foregroundMuted, fontSize: 13 },
  });

export function InlineConfirmDemo() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const [result, setResult] = useState('点击任一删除图标，再确认。');
  return (
    <InlineConfirmScope style={styles.region} testID="inline-confirm-demo">
      {['第一条记录', '第二条记录'].map((label, index) => (
        <View key={label} style={styles.row}>
          <Text style={styles.text}>{label}</Text>
          <IconButton
            icon={TrashOutlined}
            accessibilityLabel={`删除${label}`}
            onPress={() => setResult(`已确认删除${label}。`)}
            variant="glass"
            color={colors.error}
            confirmation={{
              label: '确认删除',
            }}
          />
          {index === 0 ? (
            <Button
              label="其他操作"
              variant="glass"
              onPress={() => setResult('已收到其他操作。')}
            />
          ) : null}
        </View>
      ))}
      <Text style={styles.result} accessibilityLiveRegion="polite">
        {result}
      </Text>
    </InlineConfirmScope>
  );
}
