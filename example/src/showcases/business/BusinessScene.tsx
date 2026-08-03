import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AvatarWithRing,
  GlassStats,
  GradientWash,
  Input,
  RadialHalo,
  ScreenBackdrop,
  Segmented,
  VersionPill,
  darkColors,
  lightColors,
  type ColorTokens,
  space,
  useColors,
  useSvgId,
  useThemedStyles,
} from '@unif/react-native-design';
import { ShowcaseScaffold } from '../../shared/ShowcaseScaffold';
import { SectionCard } from '../../shared/SectionCard';
import { useShowcase } from '../../state/useShowcase';

const decorativeAccessibility = {
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants' as const,
};

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
    decorationFrame: {
      height: 120,
      overflow: 'hidden',
      position: 'relative',
    },
    backdropFrame: {
      height: 220,
      overflow: 'hidden',
      position: 'relative',
    },
    specimenStack: {
      gap: space['5'],
    },
  });

export function BusinessScene(): React.JSX.Element {
  const { back, state, updateScene } = useShowcase();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const draft = state.scenes.business;
  const washGradientId = useSvgId('business-wash');
  const haloGradientId = useSvgId('business-halo');
  const customBackdropStops = {
    light: [
      { offset: 0, color: lightColors.primaryContainer },
      { offset: 1, color: lightColors.background },
    ],
    dark: [
      { offset: 0, color: darkColors.primaryContainer },
      { offset: 1, color: darkColors.background },
    ],
  };

  return (
    <ShowcaseScaffold
      title="业务复合组件"
      scene="business"
      onBack={() => {
        back();
      }}
      testID="business-screen"
    >
      <View style={styles.stack}>
        <SectionCard
          title="渐变与光晕"
          description="装饰组件由本地容器隐藏完整读屏子树，渐变标识来自公开 useSvgId。"
        >
          <View style={styles.specimenStack}>
            <View
              {...decorativeAccessibility}
              style={styles.decorationFrame}
              testID="business-gradient-simple"
            >
              <GradientWash
                height={120}
                color={colors.primary}
                fromOpacity={0.2}
                toOpacity={0}
                gradientId={washGradientId}
              />
            </View>
            <View
              {...decorativeAccessibility}
              style={styles.decorationFrame}
              testID="business-gradient-custom"
            >
              <GradientWash
                height={120}
                stops={[
                  {
                    offset: 0,
                    color: colors.info,
                    opacity: 0.24,
                  },
                  {
                    offset: 0.55,
                    color: colors.primary,
                    opacity: 0.12,
                  },
                  {
                    offset: 1,
                    color: colors.background,
                    opacity: 0,
                  },
                ]}
              />
            </View>
            <View
              {...decorativeAccessibility}
              style={styles.decorationFrame}
              testID="business-halo-circle"
            >
              <RadialHalo
                size={120}
                color={colors.primary}
                maxOpacity={0.22}
                gradientId={haloGradientId}
              />
            </View>
            <View
              {...decorativeAccessibility}
              style={styles.decorationFrame}
              testID="business-halo-ellipse"
            >
              <RadialHalo
                size={180}
                height={96}
                color={colors.info}
                stops={[
                  { offset: 0, opacity: 0.2 },
                  { offset: 0.6, opacity: 0.06 },
                  { offset: 1, opacity: 0 },
                ]}
              />
            </View>
          </View>
        </SectionCard>

        <SectionCard
          title="ScreenBackdrop"
          description="固定高度受限容器中只挂暖橙预设或按明暗主题适配的自定义背景之一。"
        >
          <Segmented
            value={draft.backdropPreset}
            items={[
              { id: 'warmOrange', label: '暖橙预设' },
              { id: 'custom', label: '自定义背景' },
            ]}
            onChange={(value) => {
              if (value !== 'warmOrange' && value !== 'custom') return;
              updateScene('business', (current) => ({
                ...current,
                backdropPreset: value,
              }));
            }}
          />
          <View
            {...decorativeAccessibility}
            style={styles.backdropFrame}
            testID="business-backdrop-wrapper"
          >
            {draft.backdropPreset === 'warmOrange' ? (
              <ScreenBackdrop preset="warmOrange" />
            ) : (
              <ScreenBackdrop
                stops={customBackdropStops}
                halos={[
                  {
                    size: 180,
                    height: 120,
                    color: colors.primary,
                    maxOpacity: 0.18,
                    top: 20,
                    centerX: true,
                  },
                ]}
              />
            )}
          </View>
        </SectionCard>

        <SectionCard title="GlassStats">
          <View style={styles.specimenStack}>
            <GlassStats
              items={[
                ['12', '今日'],
                ['86', '本月'],
              ]}
              testID="business-stats-2"
            />
            <GlassStats
              items={[
                ['¥2,016', '销售额'],
                ['28', '订单'],
                ['12', '客户'],
              ]}
              testID="business-stats-3"
            />
            <GlassStats
              items={[
                ['256', '总数'],
                ['18', '本周'],
                ['¥12.3万', '金额'],
                ['98%', '完成率'],
              ]}
              testID="business-stats-4"
            />
          </View>
        </SectionCard>

        <SectionCard title="AvatarWithRing">
          <View style={styles.row}>
            <AvatarWithRing
              label="小"
              size={48}
              ringColor={colors.primary}
              testID="business-avatar-48"
            />
            <AvatarWithRing
              label="中"
              size={64}
              ringColor={colors.info}
              testID="business-avatar-64"
            />
            <AvatarWithRing
              label="大"
              size={88}
              ringColor={colors.success}
              testID="business-avatar-88"
            />
          </View>
        </SectionCard>

        <SectionCard
          title="VersionPill"
          description="自定义状态可编辑；空白值由组件回退为“状态未知”。"
        >
          <Input
            value={draft.versionStatus}
            onChangeText={(versionStatus) =>
              updateScene('business', (current) => ({
                ...current,
                versionStatus,
              }))
            }
            accessibilityLabel="版本状态文案"
            testID="business-version-status-input"
          />
          <View style={styles.row}>
            <VersionPill version="0.20.0" />
            <VersionPill
              version="0.20.0"
              build="20260803"
              buildPrefix="构建 "
              status={{ label: draft.versionStatus }}
              testID="business-version-configured"
            />
          </View>
        </SectionCard>
      </View>
    </ShowcaseScaffold>
  );
}
