import { StyleSheet } from 'react-native';
import type { ColorTokens } from '../../../theme';
import { fw, r, radius, space, type as t } from '../../../theme';
import type { ToastKind } from './types';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    host: {
      // 定位(top/bottom/center)由 ToastHost 按 entry.position 注入,这里只留通用
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      // zIndex: toast 浮层 —— 盖在 Screen 内容之上(navigator / overlay 之下)。
      // 同级兄弟节点无 z 顺序需求,但作为 absolute 浮岛对其他屏内 absolute 节点
      // 需要显式 200 抢占,保留并锁数值。
      // 注意:confirm() 的原生 Modal 是 window 级,永远盖在 toast 之上 —— confirm
      // 打开期间到达的 toast 不可见,勿把 toast 当作 confirm 显示期间的反馈通道。
      zIndex: 200,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[2],
      backgroundColor: c.inverseSurface,
      borderRadius: radius.md,
      paddingHorizontal: space[6],
      paddingVertical: space[4],
      maxWidth: '85%',
    },
    dot: {
      // 6×6 视觉原子:dot 直径/圆角无语义 token,保留 r() 缩放原始值
      width: r(6),
      height: r(6),
      borderRadius: r(3),
    },
    text: {
      color: c.inverseOnSurface,
      fontSize: t.sm,
      fontWeight: fw.medium,
      flexShrink: 1,
    },
  });

/** kind → dot 颜色派生(返 style 值,§8 入 styles.ts)。
 *  info 无圆点(返 null),success / error 走对应 status token。 */
export function dotColorFor(kind: ToastKind, c: ColorTokens): string | null {
  switch (kind) {
    case 'success':
      return c.success;
    case 'error':
      return c.error;
    case 'info':
      return null;
  }
}
