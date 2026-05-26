import { StyleSheet } from 'react-native';
import { fw, r, radius, space, type as t, type ColorTokens } from '@/theme';

/**
 * 预生成 1..6 列的宽度规则，避免 render 时创建 `{ width: pct }` 内联对象
 * 让 Grid 在长列表 / 多 cell 场景下复用 StyleSheet 缓存。
 */
const COLUMN_WIDTHS = StyleSheet.create({
  col1: { width: '100%' },
  col2: { width: '50%' },
  col3: { width: '33.333%' },
  col4: { width: '25%' },
  col5: { width: '20%' },
  col6: { width: '16.666%' },
});

export const colWidth = (columns: number) => {
  switch (columns) {
    case 1:
      return COLUMN_WIDTHS.col1;
    case 2:
      return COLUMN_WIDTHS.col2;
    case 3:
      return COLUMN_WIDTHS.col3;
    case 5:
      return COLUMN_WIDTHS.col5;
    case 6:
      return COLUMN_WIDTHS.col6;
    case 4:
    default:
      return COLUMN_WIDTHS.col4;
  }
};

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    wrap: {
      width: '100%',
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      paddingVertical: space[5],
      paddingHorizontal: space[3],
      borderWidth: 1,
      borderColor: c.outline,
    },
    inner: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      paddingVertical: space[5],
      alignItems: 'center',
      justifyContent: 'center',
      gap: space[2],
    },
    label: {
      fontSize: t.xxs,
      fontWeight: fw.medium,
      color: c.foreground,
    },
    badge: {
      position: 'absolute',
      top: r(-6),
      right: r(-10),
      minWidth: r(16),
      height: r(16),
      borderRadius: radius.md,
      backgroundColor: c.error,
      paddingHorizontal: space[1],
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: c.onError,
      fontSize: t.nano,
      fontWeight: fw.bold,
      lineHeight: 12,
    },
  });
