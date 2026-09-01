export function resolveStepperDisplayValue(
  value: number,
  formatValue?: (value: number) => string
): number | string {
  return formatValue === undefined ? value : formatValue(value);
}
