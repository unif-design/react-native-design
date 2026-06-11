import { StyleSheet } from 'react-native';
import { fw, r, radius, space, type as t } from '../../../theme';
import type { ColorTokens } from '../../../theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    group: {
      gap: space[1],
      // [L-34] radiogroup 角色由 RadioGroup.tsx 容器 View 上设置
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      // [L-37] alignSelf:'flex-start' 防止父容器拉伸(与 Chip [M-8] 同口径)
      alignSelf: 'flex-start' as const,
      gap: space[4],
      paddingVertical: space[2],
    },
    circle: {
      width: r(20),
      height: r(20),
      // [L-79] radius.pill —— sentinel 999 确保任何尺寸下都是真圆
      borderRadius: radius.pill,
      borderWidth: r(1.5),
      borderColor: c.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: {
      width: r(8),
      height: r(8),
      // [L-79] radius.pill —— 内圆点同理
      borderRadius: radius.pill,
      backgroundColor: c.primary,
    },
    label: {
      fontSize: t.sm,
      color: c.foreground,
      fontWeight: fw.regular,
      // flexShrink:长 label 在 row 内换行/截断,不溢出也不把同行控件挤没([M-10])
      flexShrink: 1,
    },
  });
