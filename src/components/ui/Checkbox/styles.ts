import { StyleSheet } from 'react-native';
import { fw, r, radius, space, type as t } from '../../../theme';
import type { ColorTokens } from '../../../theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      // [L-37] alignSelf:'flex-start' 防止父容器拉伸(与 Chip [M-8] 同口径)
      alignSelf: 'flex-start' as const,
      gap: space[4],
    },
    box: {
      width: r(20),
      height: r(20),
      borderRadius: radius.xs,
      borderWidth: r(1.5),
      borderColor: c.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    /** [L-79] circle 形态 —— radius.pill(sentinel 999)确保任何尺寸下真圆 */
    boxCircle: {
      borderRadius: radius.pill,
    },
    /** 未选中时对勾透明但仍常驻渲染 —— 避开 react-native-svg 新架构下条件挂载(动态 mount)
     *  SVG 不重绘的问题(仅首屏 mount 渲染,toggle 后不显示)。 */
    tickHidden: { opacity: 0 },
    label: {
      fontSize: t.sm,
      color: c.foreground,
      fontWeight: fw.regular,
      // flexShrink:长 label 在 row 内换行/截断,不溢出也不把同行控件挤没([M-10])
      flexShrink: 1,
    },
  });
