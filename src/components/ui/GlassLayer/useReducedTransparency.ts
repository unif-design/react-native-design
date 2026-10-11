import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedTransparency(supported: boolean): boolean {
  // 系统偏好未读回前保持实色，避免先闪出用户禁用的透明效果。
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    if (!supported) return;
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
  }, [supported]);
  return reduced;
}
