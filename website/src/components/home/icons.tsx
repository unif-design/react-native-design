import React from 'react';

// Stroke SVG icon set — viewBox 24, strokeWidth 1.75, round caps.
// All inherit currentColor.

type IconProps = { s?: number };

const _svg = (
  s: number,
  children: React.ReactNode,
): React.JSX.Element => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

// mark icon — Layers (design site logo)
export function IconLayers({ s = 24 }: IconProps): React.JSX.Element {
  return _svg(s, <>
    <path d="M12 3l9 5-9 5-9-5z" />
    <path d="M3 13l9 5 9-5" />
  </>);
}

// feature: 基础组件
export function IconGrid({ s = 24 }: IconProps): React.JSX.Element {
  return _svg(s, <>
    <rect x={4} y={4} width={7} height={7} rx={1} />
    <rect x={13} y={4} width={7} height={7} rx={1} />
    <rect x={4} y={13} width={7} height={7} rx={1} />
    <rect x={13} y={13} width={7} height={7} rx={1} />
  </>);
}

// feature: 设计令牌
export function IconPalette({ s = 24 }: IconProps): React.JSX.Element {
  return _svg(s, <>
    <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-3.9-4-6.7-9-6.7z" />
    <circle cx={7.5} cy={11.5} r={1} />
    <circle cx={10.5} cy={7.5} r={1} />
    <circle cx={15} cy={8} r={1} />
  </>);
}

// feature: 亮/暗主题 (Typography T)
export function IconType({ s = 24 }: IconProps): React.JSX.Element {
  return _svg(s, <>
    <path d="M5 6h14" />
    <path d="M12 6v13" />
    <path d="M9 19h6" />
  </>);
}

// feature: 无障碍 (accessibility figure)
export function IconAccess({ s = 24 }: IconProps): React.JSX.Element {
  return _svg(s, <>
    <circle cx={12} cy={4} r={1.6} />
    <path d="M4 8h16" />
    <path d="M12 8v7" />
    <path d="M12 15l-3 6" />
    <path d="M12 15l3 6" />
  </>);
}

// gallery cell: 推送通知
export function IconBell({ s = 24 }: IconProps): React.JSX.Element {
  return _svg(s, <>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </>);
}

// gallery cell: 账户
export function IconUser({ s = 24 }: IconProps): React.JSX.Element {
  return _svg(s, <>
    <circle cx={12} cy={8} r={4} />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </>);
}

// gallery cell: chevron right
export function IconChevronRight({ s = 24 }: IconProps): React.JSX.Element {
  return _svg(s, <path d="M9 6l6 6-6 6" />);
}

// CTA: arrow right
export function IconArrowRight({ s = 24 }: IconProps): React.JSX.Element {
  return _svg(s, <>
    <path d="M5 12h14" />
    <path d="M13 5l7 7-7 7" />
  </>);
}

// install copy button
export function IconCopy({ s = 24 }: IconProps): React.JSX.Element {
  return _svg(s, <>
    <rect x={8} y={8} width={13} height={13} rx={2} />
    <path d="M4 16V5a2 2 0 0 1 2-2h11" />
  </>);
}

// install copy button: copied state
export function IconCheck({ s = 24 }: IconProps): React.JSX.Element {
  return _svg(s, <path d="M20 6L9 17l-5-5" />);
}
