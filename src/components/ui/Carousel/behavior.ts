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
