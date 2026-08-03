import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useColors, useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { A11Y_HIDDEN_PROPS } from '../../ui/shared/a11y';
import { buildVersionPillLabel, resolveVersionStatus } from './content';
import { makeVersionPillStyles } from './styles';
import type { VersionPillProps } from './types';

const log = createLogger('VersionPill');

/** 版本徽章胶囊 —— success dot + 版本 + 分点 + build mono。 */
export function VersionPill({
  version,
  build,
  status,
  versionPrefix = '版本 ',
  buildPrefix = 'build ',
  style,
  testID,
}: VersionPillProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeVersionPillStyles);
  const resolvedStatus = resolveVersionStatus(status, c);
  const statusDiagnosticKey = resolvedStatus.diagnostics.join(',');

  useEffect(() => {
    if (statusDiagnosticKey.length > 0) {
      log.warn('VersionPill status.label 不能为空白，已回退为“状态未知”。');
    }
  }, [statusDiagnosticKey]);
  // build 的「省略」契约:undefined / null / "" 均视为空;字符串 "0" 不省略。
  const hasBuild = build != null && build !== '';
  // 可见状态补齐颜色之外的语义；外层仍负责把全部片段合并成单一读屏名称。
  const a11yLabel = buildVersionPillLabel({
    version,
    build,
    statusLabel: resolvedStatus.label,
    versionPrefix,
    buildPrefix,
  });
  return (
    <View
      accessible
      accessibilityLabel={a11yLabel}
      style={[styles.pill, style]}
      testID={testID}
    >
      {/* 状态点仅颜色通道,屏幕阅读器由外层容器统一朗读,此处隐藏 */}
      <View
        {...A11Y_HIDDEN_PROPS}
        style={[styles.dot, { backgroundColor: resolvedStatus.color }]}
      />
      <Text {...A11Y_HIDDEN_PROPS} style={styles.status}>
        {resolvedStatus.label}
      </Text>
      <Text {...A11Y_HIDDEN_PROPS} style={styles.version}>
        {versionPrefix}
        {version}
      </Text>
      {hasBuild ? (
        <>
          {/* 分隔符「·」无语义,隐藏于无障碍树 */}
          <Text {...A11Y_HIDDEN_PROPS} style={styles.sep}>
            ·
          </Text>
          <Text {...A11Y_HIDDEN_PROPS} style={styles.build}>
            {buildPrefix}
            {build}
          </Text>
        </>
      ) : null}
    </View>
  );
}
