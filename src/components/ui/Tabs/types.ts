export type TabItem = {
  /** 唯一 id，用作 key 跟选中标识 */
  id: string;
  /** 显示文本 */
  label: string;
  /** 单 item testID（不传则自动用 `${tabsTestID}-${id}`） */
  testID?: string;
};

export type TabsProps = {
  /** 当前选中 tab 的 id */
  value: string;
  /** 切换 tab 回调 */
  onChange: (id: string) => void;
  /** tab 列表（≥2 项才显示） */
  items: TabItem[];
  /** 容器 testID；item testID 自动派生为 `${testID}-${id}` */
  testID?: string;
};
