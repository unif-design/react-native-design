import { StyleSheet, View } from 'react-native';
import { r, useColors } from '../../../theme';
import { Icon } from '../Icon';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { useListVariant } from './context';
import type { CellLeading } from './types';

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
  slot: CellLeading;
  danger?: boolean;
}) {
  const c = useColors();
  const variant = useListVariant();

  if (typeof slot === 'string') {
    // grouped 模式:裸 icon 22px;flush 模式:28×28 圆角盒子,danger 时切 error-container
    if (variant === 'flush') {
      return (
        <View
          {...A11Y_HIDDEN_PROPS}
          style={[
            sharedStyles.flushBox,
            {
              backgroundColor: danger ? c.errorContainer : c.primaryContainer,
            },
          ]}
        >
          <Icon name={slot} size={r(16)} color={danger ? c.error : c.primary} />
        </View>
      );
    }
    return (
      <View {...A11Y_HIDDEN_PROPS}>
        <Icon
          name={slot}
          size={r(22)}
          color={danger ? c.error : c.foregroundMuted}
        />
      </View>
    );
  }
  return <View {...A11Y_HIDDEN_PROPS}>{slot.node}</View>;
}
