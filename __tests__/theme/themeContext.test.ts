import { describe, expect, test } from '@jest/globals';
import {
  FALLBACK_THEME,
  resolveThemeContext,
  shouldWarnMissingThemeProvider,
} from '../../src/theme/themeContext';

describe('themeContext', () => {
  test('缺 Provider 总是返回同一个 fallback 引用', () => {
    expect(resolveThemeContext(undefined)).toBe(FALLBACK_THEME);
    expect(resolveThemeContext(undefined)).toBe(FALLBACK_THEME);
  });

  test('已有 Provider 时返回原 context 引用', () => {
    expect(resolveThemeContext(FALLBACK_THEME)).toBe(FALLBACK_THEME);
  });

  test('只有 dev + missing 才标记诊断', () => {
    expect(shouldWarnMissingThemeProvider(undefined, true)).toBe(true);
    expect(shouldWarnMissingThemeProvider(undefined, false)).toBe(false);
    expect(shouldWarnMissingThemeProvider(FALLBACK_THEME, true)).toBe(false);
  });
});
