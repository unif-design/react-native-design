import type { TabItem } from '../Tabs';

/** Segmented 尺寸:`md`=默认(达标 44pt 触控) / `sm`=紧凑(28pt,模型下拉等局促位)。 */
export type SegmentedSize = 'sm' | 'md';

/** Segmented 与 Tabs 共用 item 形状；命名独立以表达控件意图差异。 */
export type SegmentedProps = {
  value: string;
  onChange: (id: string) => void;
  items: TabItem[];
  /** 尺寸,默认 `'md'`。`'sm'` 给模型下拉等局促位用——更小,触控 < 44pt(见 styles.sizingFor) */
  size?: SegmentedSize;
  /** [L-82] 整体禁用 —— 所有 item 不可点击,a11y state 同步 */
  disabled?: boolean;
  /** 容器 testID；item testID 自动派生为 `${testID}-${id}` */
  testID?: string;
};

/** sizingFor(size) 的返回:Segmented item 随 size 变化的 3 个量。
 *  形状只取 Segmented 实际可变的维度(圆角固定 radius.sm、item 间无 gap,故无 br/gap)。 */
export type SegmentedSizing = {
  /** item 最小高度(撑起 track 高度;也是触控目标——见 sizingFor 的 [M-7] 注释) */
  minHeight: number;
  /** item 水平 padding */
  px: number;
  /** label 字号 */
  fs: number;
};
