import { StyleSheet } from 'react-native';
import { fixed, fw, radius, space, type as t } from '../../../theme';
import type { ColorTokens } from '../../../theme';
import {
  TEXTAREA_VERTICAL_PADDING,
  TEXT_FIELD_BORDER_WIDTH,
} from './constants';

/** TextField primitive styles —— Input + Textarea 共享。 */
export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[3],
      paddingHorizontal: space[5],
      borderRadius: radius.md,
      borderWidth: TEXT_FIELD_BORDER_WIDTH,
    },
    wrapInset: {
      borderRadius: radius.pill,
    },
    wrapMultiline: {
      paddingVertical: TEXTAREA_VERTICAL_PADDING,
      alignItems: 'flex-start',
    },
    wrapCentered: { alignItems: 'center' },
    focusSurface: StyleSheet.absoluteFill,
    inputCentered: { position: 'relative', zIndex: 1 },
    wrapPlain: {
      paddingHorizontal: space[3],
      paddingVertical: space[3],
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
    },
    /** Search 的可见底色/边框绝不承载命中区域。 */
    searchInteractiveRow: {
      borderWidth: 0,
    },
    searchContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[3],
    },
    multilineContent: { alignItems: 'flex-start' },
    searchVisibleSurface: {
      position: 'absolute',
      left: 0,
      right: 0,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    wrapIdle: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    /** 交互状态只改变边框，玻璃材质由独立装饰层持有。 */
    wrapActive: {
      backgroundColor: 'transparent',
    },
    wrapFocus: {
      borderColor: c.primary,
    },
    wrapFilled: {
      borderColor: c.outline,
    },
    wrapError: {
      borderColor: c.error,
    },
    input: {
      flex: 1,
      minWidth: 0,
      fontSize: t.body,
      color: c.foreground,
      padding: 0,
      margin: 0,
      // react-native-web: 抑制浏览器默认 focus outline,让 wrapFocus 的 brand 边框接管
      outlineWidth: 0,
    },
    /** multiline 覆盖:Android 默认居中,需要顶对齐 */
    inputMultiline: {
      textAlignVertical: 'top' as const,
    },
    inputScrolling: { overflow: 'scroll' },
    inputClipped: { overflow: 'hidden' },
    slotDisplay: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 18,
      minHeight: 18,
    },
    slotText: {
      color: c.foregroundMuted,
      fontSize: t.sm,
    },
    // 文字型 action 的标签:用 primary 表达「可操作」,与图标型的 muted 展示区分开;
    // 禁用降到 foregroundSubtle(与 disabled 的图标视觉降级同级)。
    slotActionLabel: {
      fontSize: t.xs,
      color: c.primary,
      fontWeight: fw.medium,
    },
    slotActionLabelDisabled: {
      color: c.foregroundSubtle,
    },
    // 命中框:44 是**下限**不是定值。写死 width 会把「获取验证码」这类文字型 action
    // 截断;用 minWidth 后图标型(内容 18)照样撑到 44,视觉不变,文字型自适应加宽。
    // minWidth / height 不走 r()/fontScale —— 它是手指可达性约束,不是视觉 token;
    // paddingHorizontal 是呼吸空间,可以随屏幕缩放。
    actionFrame: {
      minWidth: fixed.hitTarget,
      height: fixed.hitTarget,
      paddingHorizontal: space[2],
      alignItems: 'center',
      justifyContent: 'center',
    },
    compactAction: {
      alignSelf: 'center',
      borderRadius: radius.pill,
      backgroundColor: c.surfaceContainerHigh,
    },
    errorMsg: {
      fontSize: t.micro,
      color: c.error,
      marginTop: space[1],
      paddingHorizontal: space[1],
      fontWeight: fw.regular,
    },
    containerDisabled: {
      opacity: 0.5,
    },
    rootCentered: {
      justifyContent: 'center',
    },
  });
