import { StyleSheet } from 'react-native';
import { fw, radius, space, type as t } from '@/theme';
import type { ColorTokens } from '@/theme';

/** TextField primitive styles —— Input + Textarea 共享。 */
export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[3],
      paddingHorizontal: space[5],
      borderRadius: radius.md,
      borderWidth: 1,
    },
    wrapMultiline: {
      paddingVertical: space[4],
      alignItems: 'flex-start',
    },
    wrapIdle: {
      backgroundColor: c.surfaceContainerHigh,
      borderColor: 'transparent',
    },
    /** focus/filled/error 三态共享的"激活"白底 base —— 配合各 variant border 差量使用 */
    wrapActive: {
      backgroundColor: c.surface,
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
  });
