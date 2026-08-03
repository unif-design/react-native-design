import { normalizeNonBlankText } from '../shared/accessibilityName';

/** 系统请求减弱动效时，Carousel 不得启动计时 autoplay。 */
export const effectiveCarouselAutoplay = (
  autoplay: boolean | undefined,
  reducedMotion: boolean
): boolean => autoplay === true && !reducedMotion;

/** 单页不需要视觉页码，也不应为其保留布局高度。 */
export const shouldRenderCarouselPagination = (
  showIndicator: boolean,
  itemCount: number
): boolean => showIndicator && itemCount > 1;

type CarouselPressHandler<T> = (item: T, index: number) => void;
type CarouselLabelGetter<T> = (item: T, index: number) => unknown;

export type NormalizedCarouselAction<T> =
  | { kind: 'display'; diagnostics: readonly string[] }
  | {
      kind: 'action';
      onPressItem: CarouselPressHandler<T>;
      getAccessibilityLabel: CarouselLabelGetter<T>;
      diagnostics: readonly string[];
    };

/** 只有两个函数同时存在才形成 action；任何半配置/未类型化值都失败关闭为展示。 */
export function normalizeCarouselAction<T>(
  onPressItem: unknown,
  getAccessibilityLabel: unknown
): NormalizedCarouselAction<T> {
  if (onPressItem === undefined && getAccessibilityLabel === undefined) {
    return { kind: 'display', diagnostics: [] };
  }
  if (
    typeof onPressItem !== 'function' ||
    typeof getAccessibilityLabel !== 'function'
  ) {
    return { kind: 'display', diagnostics: ['action'] };
  }
  return {
    kind: 'action',
    onPressItem: onPressItem as CarouselPressHandler<T>,
    getAccessibilityLabel: getAccessibilityLabel as CarouselLabelGetter<T>,
    diagnostics: [],
  };
}

export type CarouselItemAccessibility = {
  label: string | undefined;
  diagnostics: readonly string[];
};

/** getter 的异常和非法返回值都只影响当前 item，不能让整个 Carousel render 崩溃。 */
export function resolveCarouselItemAccessibility<T>(
  getAccessibilityLabel: CarouselLabelGetter<T>,
  item: T,
  index: number,
  itemCount: number
): CarouselItemAccessibility {
  let rawLabel: unknown;
  try {
    rawLabel = getAccessibilityLabel(item, index);
  } catch {
    return { label: undefined, diagnostics: ['threw'] };
  }
  if (typeof rawLabel !== 'string') {
    return { label: undefined, diagnostics: ['invalid'] };
  }
  const label = normalizeNonBlankText(rawLabel);
  if (label === undefined) {
    return { label: undefined, diagnostics: ['blank'] };
  }
  return {
    label: `${label}，第 ${index + 1} 项，共 ${itemCount} 项`,
    diagnostics: [],
  };
}
