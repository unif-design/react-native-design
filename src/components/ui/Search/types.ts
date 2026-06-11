import type { TextInputProps } from 'react-native';

// [L-36] Omit 扩 'multiline'/'numberOfLines' —— 搜索框固定单行,这两属性无意义
export type SearchProps = Omit<
  TextInputProps,
  'style' | 'multiline' | 'numberOfLines'
> & {
  /** 提交回调（按下 return 键时触发） */
  onSubmit?: (value: string) => void;
  /** 覆盖 placeholder（默认：搜索…） */
  placeholder?: string;
  /** E2E / 测试定位 */
  testID?: string;
};
