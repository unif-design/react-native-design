import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  // 固有尺寸避免父级 stretch 拉宽圆环，文字按自然尺寸占位。
  contentSize: {
    width: 'max-content',
    height: 'max-content',
  },
  // 环不参与文字测量，保持显式直径；文字自然撑开最小容器。
  ring: { position: 'absolute' },
  label: { fontWeight: '600', textAlign: 'center', flexShrink: 0 },
});
