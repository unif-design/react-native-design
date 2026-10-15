import type { TextProps } from 'react-native';

export interface ShimmerTextProps extends Omit<TextProps, 'children'> {
  /** 保持原内容的短状态文字，不接收富文本节点。 */
  children: string;
  /** 是否播放文字扫光。默认 true；减少动态效果时保持静态。 */
  active?: boolean;
}

export interface ShimmerTextRunProps {
  text: string;
  color: string;
}
