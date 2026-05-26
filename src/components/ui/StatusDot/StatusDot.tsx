import React from 'react';
import { View } from 'react-native';
import { useColors } from '@/theme';
import { Icon } from '../Icon';
import { PulseDot } from '../Pulse';
import { paletteFor, styles } from './styles';
import type { StatusDotProps } from './types';

/**
 * 任务列表 / 推理链通用的状态圆点。
 * done = 绿底 + 白勾；active = 边框 + 内部 PulseDot；pending = 仅边框。
 */
export function StatusDot({
  status,
  size = 16,
  tone = 'flat',
  testID,
}: StatusDotProps): React.JSX.Element {
  const c = useColors();
  const { bg, border } = paletteFor(status, tone, c);

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
        <PulseDot />
      ) : null}
    </View>
  );
}
