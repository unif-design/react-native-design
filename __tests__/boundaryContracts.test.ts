import { afterEach, describe, expect, jest, test } from '@jest/globals';
import React from 'react';
import { getStepperValueAccessibilityProps as nativeStepper } from '../src/components/ui/Stepper/accessibility';
import {
  getStepperValueAccessibilityProps as webStepper,
  resolveStepperWebKey,
} from '../src/components/ui/Stepper/accessibility.web';
import { normalizeStepper } from '../src/components/ui/Stepper/normalizeStepper';
import { isIconComponent } from '../src/components/ui/shared/isIconComponent';
import { normalizeThumbnailDimensions } from '../src/components/ui/Thumbnail/normalize';
import { sanitizeTextFieldWrapperProps } from '../src/components/ui/TextField/normalize';
import {
  toast,
  completeToast,
  registerToastHost,
} from '../src/components/ui/Toast/toast';
import { resolveImageSource } from '../src/utils/imageSource';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('boundary adapters', () => {
  test('unrecognized native and Web accessibility actions do not consume or change values', () => {
    const onChange = jest.fn();
    const normalized = normalizeStepper({ value: 0, min: 0, max: 2 });
    nativeStepper({ normalized, onChange }).onAccessibilityAction?.({
      nativeEvent: { actionName: 'activate' },
    } as never);
    const preventDefault = jest.fn();
    webStepper({ normalized, onChange }).onKeyDown?.({
      nativeEvent: { key: 'Tab' },
      preventDefault,
    } as never);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(resolveStepperWebKey('Home', normalized)).toEqual({ handled: true });
    expect(
      resolveStepperWebKey(
        'End',
        normalizeStepper({ value: 2, min: 0, max: 2 })
      )
    ).toEqual({ handled: true });
  });

  test('cyclic memo icons are rejected rather than looping', () => {
    const recursive = React.memo(() => null);
    Object.defineProperty(recursive, 'type', { value: recursive });
    expect(isIconComponent(recursive)).toBe(false);
  });

  test('undefined thumbnail size selects md and wrapper ignores the internal inset surface', () => {
    expect(normalizeThumbnailDimensions(undefined)).toEqual(
      normalizeThumbnailDimensions('md')
    );
    expect(sanitizeTextFieldWrapperProps({ insetSurface: true })).toMatchObject(
      { props: {}, diagnostics: ['insetSurface'] }
    );
  });

  test.each([
    undefined,
    null,
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    2147483647,
    3.9,
  ])('toast normalizes duration %s before delivery', (duration) => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const durations: number[] = [];
    const lease = registerToastHost((delivery) => {
      durations.push(delivery.entry.duration);
      completeToast(delivery.ownerToken, delivery.leaseId, delivery.entry.id);
    });
    toast({ message: 'duration', duration: duration as number | undefined });
    expect(durations).toEqual([duration === 3.9 ? 3 : 3000]);
    lease?.release();
  });

  test.each(['wrong', -1, Number.NaN, 1.5])(
    'array Proxy cannot supply invalid length metadata %s',
    (length) => {
      const source = new Proxy([{ uri: 'a' }], {
        getOwnPropertyDescriptor(target, key) {
          const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
          return key === 'length'
            ? { ...descriptor, value: length }
            : descriptor;
        },
      });
      expect(resolveImageSource(source)).toBeUndefined();
    }
  );
});
