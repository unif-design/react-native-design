import type { TabItem } from '../Tabs';

/** Segmented 与 Tabs 共用 item 形状；命名独立以表达控件意图差异。 */
export type SegmentedProps = {
  value: string;
  onChange: (id: string) => void;
  items: TabItem[];
  /** 容器 testID；item testID 自动派生为 `${testID}-${id}` */
  testID?: string;
};
