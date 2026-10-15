import type { TextInputProps } from 'react-native';
import type { InputProps } from '../Input';

type SearchBaseProps = Omit<
  InputProps,
  | 'value'
  | 'defaultValue'
  | 'onChangeText'
  | 'leading'
  | 'trailing'
  | 'height'
  | 'returnKeyType'
  | 'accessibilityRole'
  | 'role'
  | 'onSubmitEditing'
  | 'clearButtonMode'
  | 'enterKeyHint'
> & {
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  /** 搜索图标和键盘搜索交付同一当前值；输入变化与清除不自动提交。 */
  onSubmit?: (value: string) => void;
};

export type SearchProps = SearchBaseProps &
  (
    | {
        value: string;
        onChangeText: (value: string) => void;
        defaultValue?: never;
      }
    | {
        value?: never;
        defaultValue?: string;
        onChangeText?: (value: string) => void;
      }
  );
