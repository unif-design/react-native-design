type DiagnosticWarn = (message: string) => void;
type DiagnosticFormatter = (value: unknown) => string;

const formatDiagnosticValue: DiagnosticFormatter = (value) => {
  try {
    return String(value);
  } catch {
    return '<无法序列化>';
  }
};

export function createInvalidFontScaleDiagnostic(
  warn: DiagnosticWarn,
  formatValue: DiagnosticFormatter = formatDiagnosticValue
): (value: unknown, normalizedFontScale: number, isDev: boolean) => void {
  const warnedValues = new Set<string>();

  return (value, normalizedFontScale, isDev) => {
    if (!isDev || normalizedFontScale === value) return;

    const formattedValue = formatValue(value);
    const warningKey = `${typeof value}:${formattedValue}`;
    if (warnedValues.has(warningKey)) return;

    warnedValues.add(warningKey);
    warn(`fontScale=${formattedValue} 无效，已回退为 1`);
  };
}

export function createMissingThemeProviderDiagnostic(
  warn: DiagnosticWarn
): (shouldWarn: boolean) => void {
  let warned = false;

  return (shouldWarn) => {
    if (!shouldWarn || warned) return;

    warned = true;
    warn('缺少 ThemeProvider，已使用稳定 light fallback');
  };
}
