import type { TextInputProps } from 'react-native';

export type SearchProps = Omit<TextInputProps, 'style'> & {
  /** 提交回调（按下 return 键时触发） */
  onSubmit?: (value: string) => void;
  /** 覆盖 placeholder（默认：搜索…） */
  placeholder?: string;
};
