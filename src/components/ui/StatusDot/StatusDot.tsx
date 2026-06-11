import React from 'react';
import { View } from 'react-native';
import { r, useColors } from '../../../theme';
import { Icon } from '../Icon';
import { PulseDot } from '../Pulse';
import { paletteFor, styles } from './styles';
import type { StatusDotProps } from './types';

/**
 * 任务列表 / 推理链通用的状态圆点。
 * done = 绿底 + 白勾；active = 边框 + 内部 PulseDot；pending = 仅边框。
 */
// status 派生默认 a11y label —— 不传时 SR 仍能播报状态语义。
const DEFAULT_A11Y: Record<string, string> = {
  pending: 'pending',
  active: 'active',
  done: 'done',
};

export function StatusDot({
  status,
  size = r(16),
  tone = 'flat',
  accessibilityLabel,
  testID,
}: StatusDotProps): React.JSX.Element {
  const c = useColors();
  const { bg, border } = paletteFor(status, tone, c);
  // [L-14] 优先用 caller 传入值;空字符串表示由容器负责播报,不派生默认。
  const a11yLabel =
    accessibilityLabel !== undefined
      ? accessibilityLabel || undefined
      : DEFAULT_A11Y[status];

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: border,
        },
      ]}
      accessible={!!a11yLabel}
      accessibilityLabel={a11yLabel}
      testID={testID}
    >
      {status === 'done' ? (
        <Icon
          name="check"
          size={Math.round(size * 0.6)}
          color={c.onPrimary}
          strokeWidth={2.5}
        />
      ) : status === 'active' ? (
        // [L-13] size 随外圈等比派生(系数 0.375 ≈ 6/16),视觉居中且不溢出。
        <PulseDot size={Math.round(size * 0.375)} />
      ) : null}
    </View>
  );
}
