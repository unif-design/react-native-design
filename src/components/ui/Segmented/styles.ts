import { StyleSheet } from 'react-native';
import type { ColorTokens } from '../../../theme';
import { fixed, r, radius, space, type as t } from '../../../theme';
import type { SegmentedSize, SegmentedSizing } from './types';

/** sm 紧凑高 —— 取 control.sm 的设计基准值 28,但**物理常量、不缩放**
 *  (与 md 的 fixed.hitTarget 同基准)。
 *  为何不直接用 scaled `control.sm`:大屏 `r(28)` 会涨过 md 的 44(size 语义反转,
 *  sm 反而比 md 高)。固定 28:各屏恒 < 44、与 md 维持稳定比例。 */
const SM_MIN_HEIGHT = 28;

/** Segmented 静态 base —— track chrome 与 item 居中/圆角(size-invariant)。
 *  随 size 变化的 minHeight / paddingHorizontal / fontSize 由 sizingFor(size) 注入。 */
export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    seg: {
      flexDirection: 'row',
      backgroundColor: c.surfaceContainerHigh,
      borderRadius: radius.md,
      padding: r(2),
      alignSelf: 'flex-start',
    },
    segItem: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
  });

/** Segmented 尺寸推导:2 档 size → { minHeight, px, fs }。
 *  新增 size 在 types.ts 扩 union + 这里加 case(与 Button.sizingFor 同范式)。
 *
 *  [M-7] 触控目标:item 嵌在 seg track 内,hitSlop 不越父 track 边界
 *  (≠ Button/Chip 能向外补 hitSlop)→ 只能靠 item minHeight 自撑高 track。
 *  - md(默认):minHeight = fixed.hitTarget(44pt 物理常量),触控达标,行为同改前。
 *  - sm(紧凑):minHeight = SM_MIN_HEIGHT(28pt 物理常量),为模型下拉等局促位主动小一号,
 *    接受 sub-44pt 触控(调用方按场景 opt-in);a11y role/state 不变。
 *  px / fs 走 scaled token(space/type),与 md 同基准 → sm 恒小于 md。 */
export function sizingFor(size: SegmentedSize): SegmentedSizing {
  switch (size) {
    case 'sm':
      return { minHeight: SM_MIN_HEIGHT, px: space['5'], fs: t.xxs };
    case 'md':
      return { minHeight: fixed.hitTarget, px: space['7'], fs: t.xs };
  }
}
