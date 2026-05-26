import { createContext } from 'react';
import type { GroupContext } from './types';

export const RadioContext = createContext<GroupContext | null>(null);
