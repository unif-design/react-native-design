import type { IconName } from '../Icon';

export type GridItem = {
  id: string;
  icon: IconName;
  label: string;
  /** 图标右上角的数字角标（用 string 才能写 '99+'） */
  badge?: number | string;
  /** 单 cell 测试定位（不传则自动用 `${gridTestID}-${id}`） */
  testID?: string;
};

export type GridProps = {
  items: GridItem[];
  /**
   * 列数 1..6；默认 4。
   * ⚠️ 类型外的值（如 `7`）会**告警**（dev log.warn）并回退到 4 列 — 业务应在传入前自行校验。
   */
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  onPress?: (item: GridItem) => void;
  /** 是否套白色卡片；传 false 则背景透明 */
  card?: boolean;
  /** 容器 testID；item testID 会自动派生为 `${testID}-${item.id}` */
  testID?: string;
};
