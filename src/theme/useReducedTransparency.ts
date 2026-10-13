import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useReducedTransparency(): boolean {
  // 系统偏好未读回前保持实色，避免先闪出用户禁用的透明效果。
  const [reduced, setReduced] = useState(Platform.OS === 'ios');
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
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
  }, []);
  return reduced;
}
