import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Button,
  type ColorTokens,
  childTestID,
  space,
  type,
  useThemedStyles,
} from '@unif/react-native-design';
import { useShowcase } from '../state/useShowcase';

const HISTORY_DETAIL_LIMIT = 10;

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    root: {
      gap: space['4'],
    },
    latest: {
      color: colors.foreground,
      fontSize: type.sm,
    },
    history: {
      gap: space['3'],
    },
    historyItem: {
      color: colors.foregroundMuted,
      fontSize: type.xs,
    },
    hint: {
      color: colors.foregroundSubtle,
      fontSize: type.xs,
    },
    actions: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space['5'],
    },
  });

export function ResultPanel(): React.JSX.Element | null {
  const {
    clearResults,
    state: { results },
  } = useShowcase();
  const [historyVisible, setHistoryVisible] = useState(false);
  const styles = useThemedStyles(makeStyles);
  const latest = results[0];

  if (!latest) return null;

  const history = results.slice(1, HISTORY_DETAIL_LIMIT + 1);
  return (
    <View style={styles.root}>
      <View accessibilityLiveRegion="polite" testID="result-latest">
        <Text style={styles.latest}>
          最新结果：{latest.component} · {latest.action} · {latest.summary}
        </Text>
      </View>
      <View style={styles.actions}>
        {results.length > 1 ? (
          <Button
            label={
              historyVisible
                ? '收起历史记录'
                : `查看历史记录（${results.length - 1}）`
            }
            variant="text"
            onPress={() => setHistoryVisible((current) => !current)}
          />
        ) : null}
        <Button label="清空结果" variant="text" onPress={clearResults} />
      </View>
      {historyVisible ? (
        <View style={styles.history}>
          {history.map((result) => (
            <Text
              key={result.id}
              style={styles.historyItem}
              testID={childTestID('result-history', String(result.id))}
            >
              {result.component} · {result.action} · {result.summary}
            </Text>
          ))}
          {results.length - 1 > HISTORY_DETAIL_LIMIT ? (
            <Text style={styles.hint}>仅展示最近 10 条记录</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
