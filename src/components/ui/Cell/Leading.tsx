import { StyleSheet, View } from 'react-native';
import { r, useColors } from '../../../theme';
import { useGlassFallback } from '../GlassLayer/useGlassFallback';
import { isIconComponent } from '../shared/isIconComponent';
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
  const glassFallback = useGlassFallback();
  const c = useColors();
  const variant = useListVariant();

  if (isIconComponent(slot)) {
    const Glyph = slot;
    // 危险语义由图标和标题表达，flush 图标底色与同组其他行一致。
    if (variant === 'flush') {
      return (
        <View
          {...A11Y_HIDDEN_PROPS}
          style={[
            sharedStyles.flushBox,
            {
              backgroundColor: glassFallback
                ? c.surfaceContainerHigh
                : c.primaryContainer,
            },
          ]}
        >
          <Glyph size={r(16)} color={danger ? c.error : c.primary} />
        </View>
      );
    }
    return (
      <View {...A11Y_HIDDEN_PROPS}>
        <Glyph size={r(22)} color={danger ? c.error : c.foregroundMuted} />
      </View>
    );
  }
  return <View {...A11Y_HIDDEN_PROPS}>{slot.node}</View>;
}
