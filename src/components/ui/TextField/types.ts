import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import type { IconName } from '../Icon';

/**
 * 受控:必须同时给 `value` 和 `onChangeText`。
 *
 * `defaultValue?: never` 让「同时传 value 和 defaultValue」在类型层就报错 ——
 * 那是最常见的受控/非受控混用写法,运行时表现为「defaultValue 被静默忽略」。
 */
export type ControlledTextValueProps = {
  value: string;
  onChangeText: (value: string) => void;
  defaultValue?: never;
};

/** 非受控:内部持值,`defaultValue` 只在首次 render 读一次。 */
export type UncontrolledTextValueProps = {
  value?: never;
  defaultValue?: string;
  onChangeText?: (value: string) => void;
};

/** internal —— 由 InputProps / TextareaProps / SearchProps 组合进公共类型。 */
export type TextFieldValueProps =
  | ControlledTextValueProps
  | UncontrolledTextValueProps;

/**
 * 输入类组件对外暴露的 ref。**只有** focus / blur。
 *
 * 为什么不暴露原生 TextInput —— `clear()` 会绕过值状态机(受控下把 UI 清空但调用方
 * state 不变),`setNativeProps()` 能直接改任意原生属性,两者都会让公共契约失效。
 */
export type TextFieldHandle = {
  focus: () => void;
  blur: () => void;
};

/**
 * 左右 slot 的可验证配置。**不接受任意 ReactNode** ——
 * 任意节点意味着库无法判断它是装饰还是操作,也无法保证它有可访问名称与 44pt 命中框。
 */
export type TextFieldSlot =
  | { kind: 'icon'; icon: IconName; size?: number; color?: string }
  | { kind: 'text'; value: string | number }
  | ({
      kind: 'action';
      onPress: () => void;
      accessibilityLabel: string;
      disabled?: boolean;
    } & (
      | { icon: IconName; label?: never }
      /**
       * 文字型操作(「获取验证码」「重新发送」这类)。命中框、禁用态与可访问名称
       * 与图标型完全一致 —— 只是渲染成文字。
       */
      | { label: string; icon?: never }
    ));

/**
 * containerStyle 的可用字段。六个尺寸/裁剪字段被排除 ——
 * 它们会覆盖 TextField 自持的最小命中框,让输入框缩到碰不到。
 */
export type TextFieldContainerStyle = Omit<
  ViewStyle,
  'height' | 'minHeight' | 'maxHeight' | 'minWidth' | 'maxWidth' | 'overflow'
>;

/** internal:Search 把真实交互行与仅作视觉的 surface 明确分层。 */
export type SearchFieldLayout = {
  interactiveHeight: number;
  visibleHeight: number;
  verticalInset: number;
};

/** TextField 家族共享的非值 props(内部)。 */
export type TextFieldCommonProps = {
  /** 左侧 slot —— 图标 / 文本 / 带 handler 与名称的操作 */
  leading?: TextFieldSlot;
  /** 右侧 slot —— 图标 / 文本 / 带 handler 与名称的操作 */
  trailing?: TextFieldSlot;
  /** 错误文案 —— 非空字符串时进入 error 态并在下方显示 */
  error?: string;
  /** 整体禁用 —— opacity 0.5 + 不可编辑,优先级高于原生 `editable` */
  disabled?: boolean;
  /** 外层容器样式;不接受会破坏最小 frame 的尺寸字段 */
  containerStyle?: StyleProp<TextFieldContainerStyle>;
};

/**
 * 这些原生 TextInput props 从公共类型删除:
 * - `style` / `multiline` / `numberOfLines`:由组件自己决定,单行多行分属 Input / Textarea
 * - `value` / `defaultValue` / `onChangeText`:改由严格判别联合提供
 * - `aria-disabled` / `readOnly` / `role`:与 `disabled` / `editable` / `accessibilityRole` 重复,
 *   两条入口同时存在时优先级不可预测
 * - `enterKeyHint`:与 `returnKeyType` 重复
 * - `clearTextOnFocus`:绕过值状态机静默清值
 */
export type RemovedTextInputProps =
  | 'style'
  | 'multiline'
  | 'numberOfLines'
  | 'value'
  | 'defaultValue'
  | 'onChangeText'
  | 'aria-disabled'
  | 'readOnly'
  | 'role'
  | 'enterKeyHint'
  | 'clearTextOnFocus';

/**
 * internal — TextFieldBase 的严格形状。公开组件在此基础上固定单/多行布局,
 * 因此不能由未类型化的 native prop 反向覆盖 value、slot 或命中框规则。
 */
export type TextFieldBaseProps = Omit<TextInputProps, RemovedTextInputProps> &
  TextFieldCommonProps &
  TextFieldValueProps & {
    /** internal:由 Input / Textarea / Search 固定,不作为公共可选入口。 */
    multiline: boolean;
    /** 单行 height(multiline=false 时生效),默认 control.lg */
    height?: number;
    /** 最小高度(multiline=true 时生效),默认 96 */
    minHeight?: number;
    /** 最大高度(multiline=true 时生效);超出 ScrollView 内滚 */
    maxHeight?: number;
    /** internal:Search 的 44pt interactive row + 36pt decorative surface。 */
    searchLayout?: SearchFieldLayout;
  };
