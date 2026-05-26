import { Appearance } from 'react-native';
import type { ColorScheme } from './ThemeProvider';

/** Module-level 同步 scheme 读取 —— 给不能用 hook 的场景:plugin handler / http
 *  interceptor / Boot / push 通知 等。caller 自己负责读 preference(zustand /
 *  redux / async storage / 任何 store),传进来。design 不持有 store 依赖。
 *
 *  ThemeProvider 内部走 React `useColorScheme()` hook,渲染期合理;module-level
 *  caller 不能 hook,用本函数 + Appearance 同步 API。
 *
 *  @param preference 当前用户偏好:'light' / 'dark' / 'system'
 *  @returns 实际生效的 scheme('light' / 'dark') */
export function getCurrentScheme(
  preference: ColorScheme | 'system'
): ColorScheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}
