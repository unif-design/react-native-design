import { StyleSheet } from 'react-native';
import type { ColorTokens } from '../../../theme';
import { avatar, fw, rf, space, type as t } from '../../../theme';

// 头像盒用 avatar.xl(56pt)而非 icon['2xl'] —— 两者数值相同但语义不同:
// icon.* 是图标容器阶梯,avatar.* 是头像容器阶梯。此处是用户头像,按语义选 avatar。
const AVATAR_SIZE = avatar.xl;

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    header: {
      backgroundColor: c.primary,
      paddingHorizontal: space[9],
      paddingTop: space[10],
      paddingBottom: space[9],
      gap: space[3],
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: c.primaryPressed,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImageMode: {
      overflow: 'hidden',
    },
    avatarImage: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
    },
    avatarText: {
      color: c.onPrimary,
      fontWeight: fw.bold,
      fontSize: rf(24),
    },
    name: {
      color: c.onPrimary,
      fontSize: t.h2,
      fontWeight: fw.semi,
      marginTop: space[3],
    },
    subtitle: {
      color: c.onPrimaryMuted,
      fontSize: t.xxs,
    },
  });
