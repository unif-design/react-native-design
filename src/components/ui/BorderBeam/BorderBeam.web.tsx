import React, { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { radius, useColors, usePrefersReducedMotion } from '../../../theme';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { normalizeBorderBeam } from './normalizeBorderBeam';
import { borderBeamGeometry, EMPTY_BORDER_BEAM_LAYOUT } from './shared';
import { styles } from './styles';
import type { BorderBeamProps } from './types';

const KEYFRAMES_ID = 'unif-border-beam-keyframes';
const win: any = globalThis as any;

function ensureKeyframes(): void {
  if (typeof win.document === 'undefined') return;
  if (win.document.getElementById(KEYFRAMES_ID)) return;
  const sheet = win.document.createElement('style');
  sheet.id = KEYFRAMES_ID;
  sheet.textContent =
    '@keyframes unif-border-beam-flow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: calc(-1 * var(--unif-border-beam-path)); } }';
  win.document.head.appendChild(sheet);
}

/** Web 版用 CSS keyframes 插值，JS 只在布局或 props 变化时更新一次。 */
export function BorderBeam({
  children,
  active = true,
  color,
  duration,
  lineWidth,
  size,
  borderRadius = radius.md,
  style,
  testID,
}: BorderBeamProps): React.JSX.Element {
  const colors = useColors();
  const reducedMotion = usePrefersReducedMotion();
  const [layout, setLayout] = useState(EMPTY_BORDER_BEAM_LAYOUT);
  const rectRef = useRef<any>(null);
  const normalized = normalizeBorderBeam({
    duration,
    lineWidth,
    size,
    borderRadius,
  });
  const geometry = borderBeamGeometry({ layout, ...normalized });
  const showVisual = active && !reducedMotion && geometry.perimeter > 0;

  useEffect(() => {
    if (!showVisual) return;
    ensureKeyframes();
    const node = rectRef.current;
    if (!node?.style) return;
    node.style.setProperty(
      '--unif-border-beam-path',
      `${geometry.perimeter}px`
    );
    node.style.animation = `unif-border-beam-flow ${normalized.duration}ms linear infinite`;
    return () => {
      node.style.animation = '';
    };
  }, [geometry.perimeter, normalized.duration, showVisual]);

  const handleLayout = (event: LayoutChangeEvent): void => {
    const width = Math.max(0, event.nativeEvent.layout.width);
    const height = Math.max(0, event.nativeEvent.layout.height);
    setLayout((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height }
    );
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        { borderRadius: normalized.borderRadius },
        style,
      ]}
      testID={testID}
    >
      {children}
      {showVisual ? (
        <View pointerEvents="none" style={styles.visual} {...A11Y_HIDDEN_PROPS}>
          <Svg width={layout.width} height={layout.height}>
            <Rect
              ref={rectRef}
              x={normalized.lineWidth / 2}
              y={normalized.lineWidth / 2}
              width={geometry.rectWidth}
              height={geometry.rectHeight}
              rx={geometry.radius}
              ry={geometry.radius}
              fill="none"
              stroke={color ?? colors.primary}
              strokeWidth={normalized.lineWidth}
              strokeLinecap="round"
              strokeDasharray={[
                geometry.beamLength,
                Math.max(0, geometry.perimeter - geometry.beamLength),
              ]}
            />
          </Svg>
        </View>
      ) : null}
    </View>
  );
}
