import { createContext, useContext } from 'react';

/** List → Cell 间的样式风格通道。
 *  - 'grouped' = 默认,每个 Cell 独立白卡片 + 8px 间距,无 cell 间分隔线
 *  - 'flush' = 紧凑列表,28×28 圆角 7 icon 盒子,Cell 之间 hairline 分隔线 */
export type ListVariant = 'grouped' | 'flush';

export const ListVariantContext = createContext<ListVariant>('grouped');

export const useListVariant = (): ListVariant => useContext(ListVariantContext);
