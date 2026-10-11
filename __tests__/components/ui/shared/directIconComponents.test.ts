import { describe, expect, test } from '@jest/globals';
import { createContext, memo } from 'react';
import { SendOutlined } from '@unif/react-native-icons';
import { isNavBarAction } from '../../../../src/components/ui/NavBar/isSlot';
import { normalizeTextFieldSlot } from '../../../../src/components/ui/TextField/normalize';

describe('direct icon component inputs', () => {
  test.each([SendOutlined, memo(SendOutlined)])(
    'accepts published and memoized components without a name registry',
    (icon) => {
      const action = { icon, onPress() {}, accessibilityLabel: '发送' };
      expect(isNavBarAction(action)).toBe(true);
      const slot = { kind: 'icon', icon, size: 21, color: '#fa7800' };
      expect(normalizeTextFieldSlot(slot)).toEqual({
        slot,
        diagnostics: [],
      });
    }
  );

  test.each([
    'send',
    'Svg',
    {},
    null,
    { getModuleId: 0 },
    createContext(null).Consumer,
    { $$typeof: Symbol.for('react.memo') },
  ])('rejects an old name or invalid component: %s', (icon) => {
    expect(
      isNavBarAction({ icon, onPress() {}, accessibilityLabel: '发送' })
    ).toBe(false);
    expect(normalizeTextFieldSlot({ kind: 'icon', icon }).slot).toBeUndefined();
  });
});
