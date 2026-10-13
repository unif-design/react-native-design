import { useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { ReducedTransparencyContext } from './themeContext';

export function useReducedTransparency(): boolean {
  const inherited = useContext(ReducedTransparencyContext);
  // 系统偏好未读回前保持实色，避免先闪出用户禁用的透明效果。
  const [reduced, setReduced] = useState(inherited ?? Platform.OS === 'ios');
  useEffect(() => {
    if (inherited !== undefined || Platform.OS !== 'ios') return;
    let current = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      (value) => {
        changed = true;
        setReduced(value);
      }
    );
    AccessibilityInfo.isReduceTransparencyEnabled().then(
      (value) => {
        if (current && !changed) setReduced(value);
      },
      () => {}
    );
    return () => {
      current = false;
      subscription.remove();
    };
  }, [inherited]);
  return inherited ?? reduced;
}
