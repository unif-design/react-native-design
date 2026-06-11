import type { StyleProp, ViewStyle } from 'react-native';

export type StatusDotStatus = 'pending' | 'active' | 'done';

/**
 * `flat`：pending/active 底色透明（任务列表风格）。
 * `soft`：pending = surface、active = primaryContainer，常用于推理链。
 */
export type StatusDotTone = 'flat' | 'soft';

export type StatusDotProps = {
  status: StatusDotStatus;
  size?: number;
  tone?: StatusDotTone;
  /**
   * [L-14] Screen Reader 朗读文本。
   * 不传时按 status 派生默认值("pending" / "active" / "done")。
   * 若状态语义已由父容器的 accessibilityLabel 覆盖,可传空字符串 "" 屏蔽默认值。
   *
   * 注:StatusDot 本身属于装饰性图标,状态语义通常由容器(列表行 / 任务项)负责播报;
   * 对于需要独立播报的场景(独立状态指示器),请通过此 prop 传入有意义的描述。
   */
  accessibilityLabel?: string;
  /** 容器附加样式(margin / position 等布局微调)。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
