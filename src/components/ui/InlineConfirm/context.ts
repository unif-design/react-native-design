import { createContext } from 'react';
import type { InlineConfirmCoordinator } from './types';

export const InlineConfirmContext = createContext<
  InlineConfirmCoordinator | undefined
>(undefined);
