import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ICONS, type IconDef } from '../../../icons';
import { useColors } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import type { IconProps } from './types';

const log = createLogger('Icon');

export function Icon({
  name,
  size = 18,
  color,
  strokeWidth,
  style,
  testID,
}: IconProps): React.JSX.Element {
  const c = useColors();
  const stroke = color ?? c.foregroundMuted;
  const def: IconDef | undefined = ICONS[name];
  if (!def) {
    log.warn(`unknown icon: ${name}`);
    return (
      <View
        style={[{ width: size, height: size }, style]}
        testID={testID}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }
  const sw = strokeWidth ?? def.strokeWidth;

  return (
    <View
      style={style}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {def.elements.map((el, i) => {
          // fill:currentColor → 主题 stroke 色;其余原样;缺省继承根 fill="none"。
          // opacity / stroke:透传源 svg 的元素级覆盖(stroke="none" = 纯 fill 不继承根描边)。
          const elProps = {
            fill: el.fill === 'currentColor' ? stroke : (el.fill ?? 'none'),
            opacity: el.opacity,
            stroke: el.stroke,
          };
          if (el.kind === 'path') {
            return <Path key={i} d={el.d} {...elProps} />;
          }
          if (el.kind === 'circle') {
            return (
              <Circle key={i} cx={el.cx} cy={el.cy} r={el.r} {...elProps} />
            );
          }
          if (el.kind === 'rect') {
            return (
              <Rect
                key={i}
                x={el.x}
                y={el.y}
                width={el.width}
                height={el.height}
                rx={el.rx}
                ry={el.ry}
                {...elProps}
              />
            );
          }
          return null;
        })}
      </Svg>
    </View>
  );
}
