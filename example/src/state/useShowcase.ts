import { useContext } from 'react';
import { ShowcaseContext, type ShowcaseContextValue } from './ShowcaseProvider';

export function useShowcase(): ShowcaseContextValue {
  const context = useContext(ShowcaseContext);
  if (!context) {
    throw new Error('useShowcase 必须在 ShowcaseProvider 内使用');
  }
  return context;
}
