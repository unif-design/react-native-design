import { StyleSheet } from 'react-native';
import { control, fw, r, radius, type as t } from '../../../theme';
import type { ColorTokens } from '../../../theme';
import type { StepperSize } from './types';

/** Stepper 静态 + themed base —— btn / value 容器共用 cell 基底,radius / border 走 token。
 *  尺寸(高 / 宽 / 字号)由 sizingFor 派生,sm 走 control.sm,md 走 r(32)(介于
 *  control.sm 与 control.md 之间,与 avatar.md / dim.sendBtn 同值但语义独立)。 */
export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
    },
    /** btn / value 共用的 cell 基底 —— 居中 + surface 背景 + 上下边框。
     *  左右边框 / 圆角由 btnLeft / btnRight 增量补齐;value 中间无侧边框。 */
    cell: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: c.outline,
    },
    btnLeft: {
      borderLeftWidth: 1,
      borderTopLeftRadius: radius.md,
      borderBottomLeftRadius: radius.md,
    },
    btnRight: {
      borderRightWidth: 1,
      borderTopRightRadius: radius.md,
      borderBottomRightRadius: radius.md,
    },
    btnText: {
      fontSize: t.h1,
      color: c.foreground,
      fontWeight: fw.medium,
      lineHeight: t.h1,
    },
    valueText: {
      color: c.foreground,
      fontWeight: fw.medium,
    },
  });

/** Stepper 尺寸推导:sm(control.sm=28 高 / 28 按钮 / 40 值宽 / xs 字)/
 *  md(r(32) 高 / r(32) 按钮 / r(48) 值宽 / sm 字)。
 *  新增 size 在 types.ts 加 union + 这里加 case。 */
export function sizingFor(size: StepperSize): {
  h: number;
  btn: number;
  w: number;
  fs: number;
} {
  switch (size) {
    case 'sm':
      return { h: control.sm, btn: control.sm, w: r(40), fs: t.xs };
    case 'md':
      return { h: r(32), btn: r(32), w: r(48), fs: t.sm };
  }
}
