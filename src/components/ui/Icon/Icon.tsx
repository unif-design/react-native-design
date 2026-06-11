import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ICONS, type IconDef } from '../../../icons';
import { r, useColors } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import type { IconProps } from './types';

const log = createLogger('Icon');

// 模块级去重集合:同一未知 name 只警一次,避免列表场景告警风暴。
const warnedNames = new Set<string>();

export function Icon({
  name,
  size = r(18),
  color,
  strokeWidth,
  style,
  testID,
}: IconProps): React.JSX.Element {
  const c = useColors();
  const stroke = color ?? c.foregroundMuted;
  const def: IconDef | undefined = ICONS[name];
  if (!def) {
    if (!warnedNames.has(name)) {
      warnedNames.add(name);
      log.warn(`unknown icon: ${name}`);
    }
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
          switch (el.kind) {
            case 'path':
              return <Path key={i} d={el.d} {...elProps} />;
            case 'circle':
              return (
                <Circle key={i} cx={el.cx} cy={el.cy} r={el.r} {...elProps} />
              );
            case 'rect':
              // ry 不被 build-icons.js 抽取,不在 IconElement 类型中 —— 此处不传。
              return (
                <Rect
                  key={i}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  rx={el.rx}
                  {...elProps}
                />
              );
            default: {
              // 穷尽兜底:未来若 build-icons.js 新增 kind(如 line/ellipse),
              // TypeScript 会在此行报错提示渲染端同步处理,防静默渲染空。
              const _exhaustive: never = el;
              return _exhaustive;
            }
          }
        })}
      </Svg>
    </View>
  );
}
