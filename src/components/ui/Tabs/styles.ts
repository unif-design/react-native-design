import { StyleSheet } from 'react-native';
import type { ColorTokens } from '../../../theme';
import { fixed, r, type as t } from '../../../theme';

// 下划线宽度固定 36pt —— 视觉上比 tab 文字稍宽、比整个 tab 格窄,
// 刻意不用 icon.xl(语义是图标盒),此处是装饰性下划线,用具名常量自文档化。
const UNDER_BAR_WIDTH = r(36);

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    under: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.outline,
    },
    underTab: {
      flex: 1,
      height: fixed.hitTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    underLabel: {
      fontSize: t.sm,
    },
    underBar: {
      position: 'absolute',
      bottom: 0,
      height: r(2),
      width: UNDER_BAR_WIDTH,
      backgroundColor: c.primary,
      borderRadius: r(1),
    },
  });
