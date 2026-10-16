import { StyleSheet } from 'react-native';
import { fw } from '../../../theme';

export const styles = StyleSheet.create({
  // 宽度由内容过渡决定；square 仍负责图标态的 44pt 命中补偿。
  surface: { width: undefined, paddingHorizontal: 0 },
  content: { alignItems: 'center', justifyContent: 'center' },
  layer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measurement: { position: 'absolute', flexDirection: 'row', opacity: 0 },
  label: { flexShrink: 0, fontWeight: fw.semi },
});
