import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { Icon } from '../Icon';
import { r, useColors, useThemedStyles } from '../../../theme';
import { makeStyles } from './styles';
import type { EntryCardProps } from './types';

/** 入口横向小卡 —— 独立 surface 小卡视觉,不依赖 List 容器,
 *  无 arrow / extra,纯入口语义,放在 grid 双列里靠 caller `style={{flex:1}}` 撑等宽。 */
export function EntryCard({
  icon,
  title,
  sub,
  onPress,
  style,
  testID,
}: EntryCardProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);

  const content = (
    <>
      <View style={styles.iconTile}>
        <Icon name={icon} size={r(16)} color={c.foregroundMuted} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    // a11y label 包含副标题,SR 用户听到完整信息(标题+sub)再决定是否点击
    const a11yLabel = sub ? `${title},${sub}` : title;
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        testID={testID}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View style={[styles.card, style]} testID={testID}>
      {content}
    </View>
  );
}
