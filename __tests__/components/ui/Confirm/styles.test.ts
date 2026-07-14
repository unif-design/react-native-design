import { describe, expect, test } from '@jest/globals';
import type { ViewStyle } from 'react-native';
import { lightColors } from '../../../../src/theme';
import { makeStyles } from '../../../../src/components/ui/Confirm/styles';

/** 回归锁 —— Modal 的 animationType="slide" 位移的是**整个容器**(backdrop 也在其中)。
 *  半透黑若挂在 backdrop 上,它的上边缘就会跟着 sheet 从屏底一路扫上来:位移 t 时屏幕 [0, t)
 *  这一段根本没有遮罩,顶部挂着一条未压暗的白带,一路缩到动画结束才没(缓出末段最慢,细白带在
 *  状态栏那儿赖得最久,真机肉眼可见)。
 *
 *  故遮罩必须是**独立一层**,再由 ConfirmHost 内联 `top: -屏高` 向上外扩一屏(外扩那半靠组件,
 *  本仓无 RNTL、不做渲染断言;此处锁住「dim 不许挂回会滑的那层」这半)。 */
describe('Confirm styles — 遮罩与 slide 位移解耦(纯逻辑,无组件渲染)', () => {
  const styles = makeStyles(lightColors);
  // 拓宽成 ViewStyle 再断言:styles.backdrop 的**字面量类型里已经没有 backgroundColor**
  // (加回去 = 编译期就红),这里再补一道运行时锁。
  const backdrop = styles.backdrop as ViewStyle;
  const scrim = styles.scrim as ViewStyle;

  test('backdrop(随 Modal slide 一起位移的那层)不带任何底色', () => {
    expect(backdrop.backgroundColor).toBeUndefined();
  });

  test('dim 半透黑只在独立的 scrim 层', () => {
    expect(scrim.backgroundColor).toBe(lightColors.scrim);
  });

  test('scrim 绝对定位铺满(top 由 ConfirmHost 覆写成 -屏高向上外扩)', () => {
    expect(scrim.position).toBe('absolute');
    expect(scrim.top).toBe(0);
    expect(scrim.left).toBe(0);
    expect(scrim.right).toBe(0);
    expect(scrim.bottom).toBe(0);
  });

  test('backdrop 仍是撑满 + sheet 贴底的布局层(遮罩拆走不动布局)', () => {
    expect(backdrop.flex).toBe(1);
    expect(backdrop.justifyContent).toBe('flex-end');
  });
});
