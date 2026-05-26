import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { r, useColors } from '@/theme';
import { Icon, type IconName } from '../Icon';
import { useListVariant } from './context';

const FLUSH_BOX_SIZE = r(28);
const FLUSH_BOX_RADIUS = r(7);

const sharedStyles = StyleSheet.create({
  flushBox: {
    width: FLUSH_BOX_SIZE,
    height: FLUSH_BOX_SIZE,
    borderRadius: FLUSH_BOX_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function Leading({
  slot,
  danger,
}: {
  slot: IconName | ReactNode;
  danger?: boolean;
}) {
  const c = useColors();
  const variant = useListVariant();

  if (typeof slot === 'string') {
    // grouped 模式:裸 icon 22px;flush 模式:28×28 圆角盒子,danger 时切 error-container
    if (variant === 'flush') {
      return (
        <View
          style={[
            sharedStyles.flushBox,
            {
              backgroundColor: danger ? c.errorContainer : c.primaryContainer,
            },
          ]}
        >
          <Icon
            name={slot as IconName}
            size={16}
            color={danger ? c.error : c.primary}
          />
        </View>
      );
    }
    return (
      <Icon
        name={slot as IconName}
        size={22}
        color={danger ? c.error : c.foregroundMuted}
      />
    );
  }
  return <View>{slot}</View>;
}
