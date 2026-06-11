import React from 'react';
import { Text, View } from 'react-native';
import { useColors, useThemedStyles } from '../../../theme';
import { makeVersionPillStyles } from './styles';
import type { VersionPillProps } from './types';

/** 版本徽章胶囊 —— success dot + 版本 + 分点 + build mono。 */
export function VersionPill({
  version,
  build,
  statusColor,
  versionPrefix = '版本 ',
  buildPrefix = 'build ',
  style,
  testID,
}: VersionPillProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeVersionPillStyles);
  const dotColor = statusColor ?? c.success;
  // build 的「省略」契约:undefined / null / "" 均视为空;字符串 "0" 不省略。
  const hasBuild = build != null && build !== '';
  // 状态点用颜色传达语义,SR 无法感知;整个 pill 作为分组提供无障碍合并读出。
  const a11yLabel = hasBuild
    ? `${versionPrefix}${version},${buildPrefix}${build}`
    : `${versionPrefix}${version}`;
  return (
    <View
      accessible
      accessibilityLabel={a11yLabel}
      style={[styles.pill, style]}
      testID={testID}
    >
      {/* 状态点仅颜色通道,屏幕阅读器由外层容器统一朗读,此处隐藏 */}
      <View
        style={[styles.dot, { backgroundColor: dotColor }]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text
        style={styles.version}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {versionPrefix}
        {version}
      </Text>
      {hasBuild ? (
        <>
          {/* 分隔符「·」无语义,隐藏于无障碍树 */}
          <Text
            style={styles.sep}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            ·
          </Text>
          <Text
            style={styles.build}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {buildPrefix}
            {build}
          </Text>
        </>
      ) : null}
    </View>
  );
}
