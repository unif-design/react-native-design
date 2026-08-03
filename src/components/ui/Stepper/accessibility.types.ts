import type { NativeSyntheticEvent, ViewProps } from 'react-native';
import type { NormalizedStepper } from './normalizeStepper';

export type StepperAccessibilityInput = {
  normalized: NormalizedStepper;
  onChange: (value: number) => void;
};

type StepperKeyDownEvent = NativeSyntheticEvent<Readonly<{ key: string }>>;

export type StepperValueAccessibilityProps = {
  'accessibilityState'?: ViewProps['accessibilityState'];
  'accessibilityValue'?: ViewProps['accessibilityValue'];
  'accessibilityActions'?: ViewProps['accessibilityActions'];
  'onAccessibilityAction'?: ViewProps['onAccessibilityAction'];
  'aria-disabled'?: ViewProps['aria-disabled'];
  'aria-valuemin'?: ViewProps['aria-valuemin'];
  'aria-valuemax'?: ViewProps['aria-valuemax'];
  'aria-valuenow'?: ViewProps['aria-valuenow'];
  'tabIndex'?: ViewProps['tabIndex'];
  'onKeyDown'?: (event: StepperKeyDownEvent) => void;
};
