import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  Icon,
  IconButton,
  Segmented,
  StatusDot,
  Tag,
  type ButtonSize,
  type ButtonVariant,
  type ColorTokens,
  type IconButtonProps,
  type StatusDotStatus,
  type StatusDotTone,
  type TagSize,
  type TagVariant,
  space,
  useColors,
  useThemedStyles,
} from '@unif/react-native-design';
import { ShowcaseScaffold } from '../../shared/ShowcaseScaffold';
import { SectionCard } from '../../shared/SectionCard';
import { useShowcase } from '../../state/useShowcase';

const buttonVariants: readonly ButtonVariant[] = [
  'primary',
  'secondary',
  'ghost',
  'neutral',
  'outline',
  'danger',
  'text',
];
const buttonSizes: readonly ButtonSize[] = ['sm', 'md', 'lg'];
const iconButtonVariants: readonly NonNullable<IconButtonProps['variant']>[] = [
  'primary',
  'secondary',
  'ghost',
  'neutral',
  'outline',
  'danger',
];
const tagVariants: readonly TagVariant[] = [
  'neutral',
  'brand',
  'success',
  'error',
  'info',
  'outline',
];
const tagSizes: readonly TagSize[] = ['md', 'lg'];
const statuses: readonly StatusDotStatus[] = [
  'pending',
  'active',
  'done',
  'error',
];
const statusTones: readonly StatusDotTone[] = ['flat', 'soft'];

const variantLabels: Readonly<Record<ButtonVariant, string>> = {
  primary: '主按钮',
  secondary: '次按钮',
  ghost: '幽灵按钮',
  neutral: '中性按钮',
  outline: '描边按钮',
  danger: '危险按钮',
  text: '文字按钮',
};
const variantTabLabels: Readonly<Record<ButtonVariant, string>> = {
  primary: '主色',
  secondary: '次要',
  ghost: '幽灵',
  neutral: '中性',
  outline: '描边',
  danger: '危险',
  text: '文字',
};
const sizeLabels: Readonly<Record<ButtonSize, string>> = {
  sm: '小尺寸',
  md: '中尺寸',
  lg: '大尺寸',
};
const iconVariantLabels: Readonly<
  Record<NonNullable<IconButtonProps['variant']>, string>
> = {
  primary: '主色图标按钮',
  secondary: '次要图标按钮',
  ghost: '幽灵图标按钮',
  neutral: '中性图标按钮',
  outline: '描边图标按钮',
  danger: '危险图标按钮',
};
const tagVariantLabels: Readonly<Record<TagVariant, string>> = {
  neutral: '中性标签',
  brand: '品牌标签',
  success: '成功标签',
  error: '错误标签',
  info: '信息标签',
  outline: '描边标签',
};
const statusLabels: Readonly<Record<StatusDotStatus, string>> = {
  pending: '等待状态',
  active: '进行状态',
  done: '完成状态',
  error: '错误状态',
};

const variantItems = buttonVariants.map((variant) => ({
  id: variant,
  label: variantTabLabels[variant],
}));
const sizeItems = buttonSizes.map((size) => ({
  id: size,
  label: sizeLabels[size],
}));

const makeStyles = (_colors: ColorTokens) =>
  StyleSheet.create({
    stack: {
      gap: space['7'],
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space['5'],
    },
  });

function isButtonVariant(value: string): value is ButtonVariant {
  return buttonVariants.some((variant) => variant === value);
}

function isButtonSize(value: string): value is ButtonSize {
  return buttonSizes.some((size) => size === value);
}

export function ActionsScene(): React.JSX.Element {
  const { appendResult, back, state, updateScene } = useShowcase();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const draft = state.scenes.actions;
  const record = (component: string, action: string, summary: string) => {
    appendResult({ scene: 'actions', component, action, summary });
  };

  return (
    <ShowcaseScaffold
      title="操作与状态"
      scene="actions"
      onBack={() => {
        back();
      }}
      testID="actions-screen"
    >
      <View style={styles.stack}>
        <SectionCard
          title="按钮配置器"
          description="选择公开变体与尺寸，配置会在场景切换后保留。"
        >
          <Segmented
            value={draft.buttonVariant}
            items={variantItems}
            onChange={(value) => {
              if (!isButtonVariant(value)) return;
              updateScene('actions', (current) => ({
                ...current,
                buttonVariant: value,
              }));
            }}
          />
          <Segmented
            value={draft.buttonSize}
            items={sizeItems}
            onChange={(value) => {
              if (!isButtonSize(value)) return;
              updateScene('actions', (current) => ({
                ...current,
                buttonSize: value,
              }));
            }}
          />
          <Button
            label="运行配置按钮"
            variant={draft.buttonVariant}
            size={draft.buttonSize}
            loading={draft.buttonLoading}
            testID="actions-configured-button"
            onPress={() => record('Button', '点击', '配置按钮已触发')}
          />
        </SectionCard>

        <SectionCard title="Button 公开状态">
          <View style={styles.row}>
            {buttonVariants.map((variant) => (
              <Button
                key={variant}
                label={variantLabels[variant]}
                variant={variant}
                testID={`actions-button-variant-${variant}`}
                onPress={() =>
                  record('Button', '点击', `${variantLabels[variant]}已触发`)
                }
              />
            ))}
          </View>
          <View style={styles.row}>
            {buttonSizes.map((size) => (
              <Button
                key={size}
                label={sizeLabels[size]}
                size={size}
                testID={`actions-button-size-${size}`}
                onPress={() =>
                  record('Button', '点击', `${sizeLabels[size]}已触发`)
                }
              />
            ))}
          </View>
          <Button
            block
            label="双图标块级按钮"
            leftIcon="check"
            rightIcon="arrow-right"
            testID="actions-button-icons"
            onPress={() => record('Button', '点击', '双图标块级按钮已触发')}
          />
          <View style={styles.row}>
            <Button
              label="禁用按钮"
              disabled
              onPress={() => record('Button', '点击', '禁用按钮已触发')}
            />
            <Button
              label="加载按钮"
              loading
              onPress={() => record('Button', '点击', '加载按钮已触发')}
            />
          </View>
        </SectionCard>

        <SectionCard title="IconButton 公开状态">
          <View style={styles.row}>
            {iconButtonVariants.map((variant) => (
              <IconButton
                key={variant}
                icon="bell"
                variant={variant}
                accessibilityLabel={iconVariantLabels[variant]}
                testID={`actions-icon-button-variant-${variant}`}
                onPress={() =>
                  record(
                    'IconButton',
                    '点击',
                    `${iconVariantLabels[variant]}已触发`
                  )
                }
              />
            ))}
          </View>
          <View style={styles.row}>
            {buttonSizes.map((size) => (
              <IconButton
                key={size}
                icon="check"
                size={size}
                accessibilityLabel={`${sizeLabels[size]}图标按钮`}
                testID={`actions-icon-button-size-${size}`}
                onPress={() =>
                  record('IconButton', '点击', `${sizeLabels[size]}已触发`)
                }
              />
            ))}
            <IconButton
              icon="spark"
              color={colors.success}
              accessibilityLabel="自定义颜色图标按钮"
              testID="actions-icon-button-color"
              onPress={() =>
                record('IconButton', '点击', '自定义颜色图标按钮已触发')
              }
            />
            <IconButton
              icon="close"
              disabled
              accessibilityLabel="禁用图标按钮"
              testID="actions-icon-button-disabled"
              onPress={() => record('IconButton', '点击', '禁用图标按钮已触发')}
            />
            <IconButton
              icon="plus"
              loading
              accessibilityLabel="加载图标按钮"
              testID="actions-icon-button-loading"
              onPress={() => record('IconButton', '点击', '加载图标按钮已触发')}
            />
          </View>
        </SectionCard>

        <SectionCard title="Chip 状态">
          <View style={styles.row}>
            <Chip label="静态标签" testID="actions-chip-static" />
            <Chip
              label="可选择标签"
              selected={draft.chipSelected}
              onPress={() => {
                const selected = !draft.chipSelected;
                updateScene('actions', (current) => ({
                  ...current,
                  chipSelected: selected,
                }));
                record('Chip', '选择', selected ? '标签已选中' : '标签已取消');
              }}
            />
            <Chip
              label="禁用标签"
              disabled
              onPress={() => record('Chip', '点击', '禁用标签已触发')}
            />
            <Chip
              label="处理中标签"
              busy
              onPress={() => record('Chip', '点击', '处理中标签已触发')}
            />
            <Chip
              label="禁用处理中标签"
              busy
              disabled
              onPress={() => record('Chip', '点击', '禁用处理中标签已触发')}
            />
            <Chip
              label="前后插槽标签"
              leading={<Icon name="spark" size={12} />}
              trailing={<Icon name="close" size={12} />}
              testID="actions-chip-slots"
              onPress={() => record('Chip', '点击', '前后插槽标签已触发')}
            />
          </View>
        </SectionCard>

        <SectionCard title="Tag 展示矩阵">
          <View style={styles.row}>
            {tagVariants.flatMap((variant) =>
              tagSizes.map((size) => (
                <Tag
                  key={`${variant}-${size}`}
                  label={`${tagVariantLabels[variant]}${
                    size === 'lg' ? '大尺寸' : '中尺寸'
                  }`}
                  variant={variant}
                  size={size}
                  testID={`actions-tag-${variant}-${size}`}
                />
              ))
            )}
          </View>
        </SectionCard>

        <SectionCard title="StatusDot 状态矩阵">
          <View style={styles.row}>
            {statuses.flatMap((status) =>
              statusTones.map((tone) => (
                <StatusDot
                  key={`${status}-${tone}`}
                  status={status}
                  tone={tone}
                  accessibilityLabel={`${statusLabels[status]}${
                    tone === 'soft' ? '柔和' : '平面'
                  }`}
                  testID={`actions-status-${status}-${tone}`}
                />
              ))
            )}
          </View>
        </SectionCard>
      </View>
    </ShowcaseScaffold>
  );
}
