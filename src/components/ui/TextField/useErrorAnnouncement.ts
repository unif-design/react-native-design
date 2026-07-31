import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/** iOS 不会像 Android live region 一样自动播报动态错误,仅播报真实的后续变更。 */
export function useErrorAnnouncement(error: string | undefined): void {
  const previousError = useRef('');
  const didCommit = useRef(false);

  useEffect(() => {
    const nextError = error ?? '';
    const previous = previousError.current;
    previousError.current = nextError;

    if (!didCommit.current) {
      didCommit.current = true;
      return undefined;
    }
    if (Platform.OS !== 'ios' || nextError === '' || nextError === previous) {
      return undefined;
    }

    const timer = setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(nextError);
    }, 0);
    return () => clearTimeout(timer);
  }, [error]);
}
