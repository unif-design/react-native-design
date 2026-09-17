import { createLogger } from '../../../utils/logger';
import { usePulseAnimation } from '../shared/pulse/usePulseAnimation';
import { PULSE_DEFAULTS } from './constants';
import type { PulseOptions } from './types';

const log = createLogger('Pulse');

export function usePulse(options: PulseOptions = {}) {
  return usePulseAnimation(options, PULSE_DEFAULTS, log);
}
