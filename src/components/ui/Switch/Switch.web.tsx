import React, { useEffect } from 'react';
import { Pressable } from 'react-native-gesture-handler';
import { Text, View } from 'react-native';
import {
  motion,
  useColors,
  usePrefersReducedMotion,
  useThemedStyles,
} from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { childTestID } from '../../../utils/testID';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import { GlassLayer } from '../GlassLayer';
import {
  makeStyles,
  LABELED_THUMB_ON_X,
  THUMB_OFF_X,
  THUMB_ON_X,
} from './styles';
import type { SwitchProps } from './types';

const log = createLogger('Switch');

/**
 * Web 端 Switch —— RN-Web 上 reanimated 4 + worklets 0.9.x 的 useAnimatedStyle
 * 链路会抛 `Object.keys(undefined)` TypeError(切换时打印,thumb 卡住),走 CSS
 * transition 实现 backgroundColor + translateX,native 端仍走 Switch.tsx
 * 的 reanimated 实现。
 *
 * 实现:track / thumb 仍是 RN View(尺寸 / 圆角走 RN style),把 web-only
 * backgroundColor transition 通过 `style` 行内 CSS prop 注入(RN-Web 把
 * style 数组合并到 element 的 inline style,我们补 `transition` 字段)。
 */
export function Switch({
  value,
  onChange,
  disabled,
  accessibilityLabel,
  stateLabels,
  testID,
}: SwitchProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = usePrefersReducedMotion();
  const accessibleName = normalizeNonBlankText(accessibilityLabel);
  const hasBlankLabel = accessibleName === undefined;
  const isDisabled = disabled === true || hasBlankLabel;
  const label = normalizeNonBlankText(
    value ? stateLabels?.on : stateLabels?.off
  );
  const hasLabels = label !== undefined;

  useEffect(() => {
    if (hasBlankLabel) {
      log.warn('Switch accessibilityLabel 不能为空白，当前 action 已禁用。');
    }
  }, [hasBlankLabel]);

  // 给 RN style 数组追加 web-only 字段；reduced motion 时连 transition key
  // 都不输出，避免浏览器仍创建零时长 transition。
  const trackWebStyle = {
    ...styles.track,
    ...(hasLabels ? styles.labeledTrack : {}),
    backgroundColor: value ? c.primary : c.surfaceContainerHighest,
    ...(reducedMotion
      ? {}
      : {
          // RN style 不识 transition 但 RN-Web 会把它当 inline style 透传给 DOM
          transitionProperty: 'background-color',
          transitionDuration: `${motion.base}ms`,
          transitionTimingFunction: 'ease-out',
        }),
  } as unknown as object;
  const thumbWebStyle = {
    ...styles.thumb,
    ...(hasLabels
      ? { ...styles.labeledThumb, left: value ? '100%' : '0%' }
      : {}),
    transform: [
      {
        translateX: value
          ? hasLabels
            ? LABELED_THUMB_ON_X
            : THUMB_ON_X
          : THUMB_OFF_X,
      },
    ],
    ...(reducedMotion
      ? {}
      : {
          transitionProperty: hasLabels ? 'left, transform' : 'transform',
          transitionDuration: `${motion.base}ms`,
          transitionTimingFunction: 'ease-out',
        }),
  } as unknown as object;

  return (
    <Pressable
      accessible={!hasBlankLabel}
      onPress={isDisabled ? undefined : () => onChange(!value)}
      disabled={isDisabled}
      style={[styles.pressable, hasLabels && styles.labeledPressable]}
      accessibilityRole={hasBlankLabel ? undefined : 'switch'}
      role={hasBlankLabel ? undefined : 'switch'}
      aria-checked={hasBlankLabel ? undefined : value}
      aria-disabled={hasBlankLabel ? undefined : isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      accessibilityState={
        hasBlankLabel ? undefined : { checked: value, disabled: isDisabled }
      }
      accessibilityLabel={accessibleName}
      accessibilityValue={hasLabels ? { text: label } : undefined}
      testID={testID}
    >
      <View
        {...A11Y_HIDDEN_PROPS}
        style={[styles.visualFrame, hasLabels && styles.labeledFrame]}
        testID={childTestID(testID, 'visual')}
      >
        <View
          style={[trackWebStyle, isDisabled && styles.trackDisabled]}
          testID={childTestID(testID, 'track')}
        >
          {hasLabels ? (
            <Text
              numberOfLines={1}
              style={[
                styles.stateLabel,
                value ? styles.labelOn : styles.labelOff,
              ]}
            >
              {label}
            </Text>
          ) : null}
        </View>
        <View style={thumbWebStyle} testID={childTestID(testID, 'thumb')}>
          <GlassLayer
            style={styles.thumbMaterial}
            testID={childTestID(testID, 'thumb-glass')}
          />
        </View>
      </View>
    </Pressable>
  );
}
