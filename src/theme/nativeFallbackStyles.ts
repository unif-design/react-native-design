import { useMemo } from 'react';
import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import { usesNativeFallbackColors } from './nativeFallbackColors';
import { useTheme } from './useTheme';

/** 旧原生系统的浅色实体表面；支持玻璃时的减少透明度仍保留原有外观。 */
export function useNativeFallbackLight(): boolean {
  return useTheme().scheme === 'light' && usesNativeFallbackColors();
}

/** 共用装饰，阴影放外壳、边线放绝对背景层，避免改变内容尺寸。 */
export const nativeFallbackStyles = StyleSheet.create({
  control: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  controlBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1.5,
    elevation: 1,
  },
  cardBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ECECF0',
  },
  floating: {
    backgroundColor: '#FFFFFF',
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D8D8DD',
  },
  input: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  inputBorder: {
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  icon: { backgroundColor: '#FDF1E6' },
  welcomeIcon: { backgroundColor: '#FDF1E6' },
});

type NativeSurfaceStyles = Readonly<
  {
    icon: Readonly<Pick<ViewStyle, 'backgroundColor'>>;
    floating: Readonly<ViewStyle>;
  } & Partial<
    Record<
      Exclude<keyof typeof nativeFallbackStyles, 'icon' | 'floating'>,
      Readonly<ViewStyle>
    >
  >
>;

/** 原生降级表面装饰；调用方保留布局，输入表面同时承接已有暗色降级。 */
export function useNativeSurfaceStyles(): NativeSurfaceStyles {
  const { colors, shadow, scheme } = useTheme();
  const nativeFallback = usesNativeFallbackColors();
  const platform = Platform.OS;
  return useMemo(() => {
    if (nativeFallback && scheme === 'light') return nativeFallbackStyles;
    const icon = {
      backgroundColor:
        platform === 'web'
          ? colors.primaryContainer
          : colors.surfaceContainerHigh,
    };
    const floating: ViewStyle = {
      backgroundColor: 'transparent',
      shadowColor: colors.scrim,
      shadowOpacity: 0.2,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    };
    if (!nativeFallback) return { icon, floating };
    return {
      icon,
      floating,
      input: {
        backgroundColor: colors.surfaceContainerHigh,
        ...shadow.subtle,
      },
      inputBorder: { borderWidth: 0.5, borderColor: colors.outlineVariant },
    };
  }, [nativeFallback, scheme, colors, shadow, platform]);
}
