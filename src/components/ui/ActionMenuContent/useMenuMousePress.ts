import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { PointerEvent } from 'react-native';

/** Web 菜单按下时保留原输入焦点；实际选择只由 Pressable.onPress 交付。 */
export function useMenuMousePress(disabled: boolean) {
  const [pressed, setPressed] = useState(false);
  const enabled = Platform.OS === 'web' && !disabled;
  useEffect(() => {
    if (disabled) setPressed(false);
  }, [disabled]);
  const begin = (event: PointerEvent) => {
    if (
      !enabled ||
      event.nativeEvent.pointerType !== 'mouse' ||
      event.nativeEvent.button !== 0
    )
      return;
    event.preventDefault();
    setPressed(true);
  };
  const end = () => setPressed(false);
  return {
    mousePressed: enabled && pressed,
    onPointerDown: begin,
    onPointerUp: end,
    onPointerCancel: end,
    onPointerLeave: end,
  };
}
