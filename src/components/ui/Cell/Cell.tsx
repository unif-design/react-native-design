import React, { useEffect } from 'react';
import { type StyleProp, Text, type TextStyle, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { pressedOpacity, r, useColors, useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { Icon } from '../Icon';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import {
  resolveCellActionAccessibilityLabel,
  resolveCellTitleColor,
  stringifyCellText,
} from './content';
import { useListVariant } from './context';
import { Leading } from './Leading';
import { makeStyles } from './styles';
import type { CellExtra, CellProps } from './types';

const log = createLogger('Cell');

function CellExtraContent({
  extra,
  textStyle,
}: {
  extra: CellExtra | undefined;
  textStyle: StyleProp<TextStyle>;
}): React.JSX.Element | null {
  if (!extra) return null;
  switch (extra.kind) {
    case 'text':
      return (
        <Text style={textStyle} numberOfLines={1}>
          {stringifyCellText(extra.value)}
        </Text>
      );
    case 'display':
      return <View {...A11Y_HIDDEN_PROPS}>{extra.node}</View>;
    case 'control':
      return extra.node;
  }
}

/**
 * 设置 / 列表行。布局:`leading? · (title / desc) · extra? · arrow?`
 *
 * 两种风格(由父 `<List>` 通过 ListVariantContext 决定):
 * - `grouped`(默认):独立白卡片 + 8px 间距
 * - `flush`(嵌在 Card 内):紧凑列表,28×28 橙色 icon 盒子,行间 inset hairline 分隔
 */
export function Cell(props: CellProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const variant = useListVariant();
  const flush = variant === 'flush';
  const requestedAction = typeof props.onPress === 'function';
  const accessibilityLabel = requestedAction
    ? resolveCellActionAccessibilityLabel({
        accessibilityLabel: props.accessibilityLabel,
        title: props.title,
        desc: props.desc,
        extra: props.extra,
      })
    : undefined;
  const hasEffectiveAction =
    requestedAction && accessibilityLabel !== undefined;
  const hasMissingActionName = requestedAction && !hasEffectiveAction;

  useEffect(() => {
    if (hasMissingActionName) {
      log.warn('Cell action 缺少非空业务名称，已按 display-only 渲染。');
    }
  }, [hasMissingActionName]);

  const cellStyle = [
    styles.cell,
    flush && styles.cellFlush,
    flush && props.desc !== undefined && styles.cellFlushWithDesc,
    props.style,
  ];

  const titleColor = resolveCellTitleColor({
    danger: props.danger,
    selected: props.selected,
    dangerColor: c.error,
    selectedColor: c.primary,
  });
  const titleStyle = [
    flush ? styles.titleFlush : styles.title,
    titleColor && { color: titleColor },
  ];
  const descStyle = flush ? styles.descFlush : styles.desc;
  const extraStyle = flush ? styles.extraFlush : styles.extra;

  const inner = (
    <View
      style={cellStyle}
      testID={hasEffectiveAction ? undefined : props.testID}
    >
      {props.leading !== undefined ? (
        <Leading slot={props.leading} danger={props.danger} />
      ) : null}
      <View style={styles.body}>
        <Text style={titleStyle} numberOfLines={props.titleLines ?? 1}>
          {stringifyCellText(props.title)}
        </Text>
        {props.desc !== undefined ? (
          <Text style={descStyle} numberOfLines={2}>
            {stringifyCellText(props.desc)}
          </Text>
        ) : null}
      </View>
      <CellExtraContent extra={props.extra} textStyle={extraStyle} />
      {hasEffectiveAction && props.arrow && !props.danger ? (
        <View
          {...A11Y_HIDDEN_PROPS}
          style={flush ? styles.chevronFlush : undefined}
        >
          <Icon
            name="chevron-right"
            size={r(flush ? 18 : 20)}
            color={c.foregroundSubtle}
          />
        </View>
      ) : null}
    </View>
  );

  if (hasEffectiveAction) {
    const isDisabled = props.disabled === true;

    return (
      <Pressable
        onPress={isDisabled ? undefined : props.onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={props.accessibilityHint}
        // 选中态必须进 a11y state:只靠 primary 色区分的话,色觉障碍与读屏用户
        // 都感知不到「当前是哪一项」。
        accessibilityState={{ disabled: isDisabled, selected: props.selected }}
        testID={props.testID}
        style={({ pressed }) => [
          { opacity: isDisabled ? 0.5 : pressed ? pressedOpacity : 1 },
        ]}
      >
        {inner}
      </Pressable>
    );
  }

  // 不可点但显式给了整行名称(Static 分支):合成单个 a11y 节点按指定文案播报。
  // 没给就保持裸渲染 —— 读屏按 title / desc / extra 各自的文本节点逐个读。
  const staticLabel = props.accessibilityLabel;
  if (staticLabel !== undefined && staticLabel.trim().length > 0) {
    return (
      <View
        accessible
        accessibilityLabel={staticLabel}
        accessibilityState={
          props.selected === undefined
            ? undefined
            : { selected: props.selected }
        }
        testID={props.testID}
      >
        {inner}
      </View>
    );
  }
  return inner;
}
