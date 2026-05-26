import type { IconName } from '../../../icons';

export type EmptyProps = {
  /** 主标题（如「暂无数据」） */
  title: string;
  /** 副描述（建议下一步操作） */
  desc?: string;
  /** illust 圆盘内的图标,默认 `'spark'`(通用空态)。
   *  相机域可传 `'camera-off'` / `'permission-denied'` / `'error-alert'` 等强语义 icon。 */
  icon?: IconName;
  /** E2E / 测试定位 */
  testID?: string;
};
