import type { StyleProp, ViewStyle } from 'react-native';

export type TabItem = {
  /** 唯一 id，用作 key 跟选中标识 */
  id: string;
  /** 显示文本 */
  label: string;
  /** 禁用该 tab —— disabled=true 时不可点击 + SR 报 disabled 状态 */
  disabled?: boolean;
  /** 单 item testID（不传则自动用 `${tabsTestID}-${id}`） */
  testID?: string;
};

export type TabsProps = {
  /** 当前选中 tab 的 id */
  value: string;
  /** 切换 tab 回调 */
  onChange: (id: string) => void;
  /** tab 列表（≥2 项才显示）
   *  @note 传入 < 2 项时组件仍渲染,但通常无意义;调用方应保证传入 ≥2 项。 */
  items: TabItem[];
  /** 整体禁用 —— 所有 tab 不可点击(如异步加载数据期间) */
  disabled?: boolean;
  /** 容器附加样式(margin / position 等布局微调)。 */
  style?: StyleProp<ViewStyle>;
  /** 容器 testID；item testID 自动派生为 `${testID}-${id}` */
  testID?: string;
};
