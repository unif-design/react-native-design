import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type BottomSheetProps = {
  /** snap points,默认 `['30%', '60%', '95%']` 三档可拖。
   *  专用场景显式覆盖,如单档不可调 `['90%']`、短确认 + 中 `['40%', '85%']`。 */
  snapPoints?: (string | number)[];
  /** Sheet 内容 */
  children: ReactNode;
  /** Sheet 容器附加样式(影响 BottomSheetView style) */
  sheetStyle?: StyleProp<ViewStyle>;
  /** Backdrop 模式,默认 'scrim':
   *  - `'scrim'`:@gorhom 默认 BottomSheetBackdrop,单色半透黑
   *  - `'blur'`:自定义 BlurBackdrop(BlurLayer intensity='strong')
   *  - `'none'`:无 backdrop,适合"屏 root 已有自己 backdrop"场景 */
  backdrop?: 'scrim' | 'blur' | 'none';
  /** 是否显示顶部 grabber(默认 true) */
  grabber?: boolean;
  /** Sheet 关闭(animatedIndex 收到 -1)时触发。
   *
   *  **transparentModal route 模式必传 `navigation.goBack()`** —— 不然关闭 sheet 后,
   *  屏 route 没 pop,native overlay 屏继续覆盖,触摸全被屏吞掉。 */
  onClose?: () => void;
  /** E2E / 测试定位 */
  testID?: string;
};
