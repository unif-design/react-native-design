import { isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useReducedTransparency } from '../../../theme/useReducedTransparency';

/** 组件外壳与装饰层共用原生材质判定，偏好由 ThemeProvider 持有。 */
export function useGlassFallback(): boolean {
  const reduced = useReducedTransparency();
  return !isLiquidGlassSupported || reduced;
}
