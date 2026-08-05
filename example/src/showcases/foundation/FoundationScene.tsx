import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BRAND_ORANGE,
  Button,
  ICONS,
  ICON_NAMES,
  Segmented,
  addTransport,
  avatar,
  avatarGradient,
  blur,
  consoleTransport,
  control,
  createLogger,
  darkColors,
  darkShadow,
  dim,
  fixed,
  fontMono,
  fw,
  getLogLevel,
  icon,
  lightColors,
  lightShadow,
  motion,
  normalizeFontScale,
  pressedOpacity,
  r,
  radius,
  removeTransport,
  rf,
  scaleFontMetric,
  setLogLevel,
  space,
  type,
  useColors,
  useFontScale,
  usePrefersReducedMotion,
  useShadow,
  useTheme,
  useThemedStyles,
  warmOrangePalette,
  type ColorTokens,
  type LogTransport,
} from '@unif/react-native-design';
import { ShowcaseScaffold } from '../../shared/ShowcaseScaffold';
import { SectionCard } from '../../shared/SectionCard';
import { isFontScalePreset, isThemeMode } from '../../state/showcaseState';
import { useShowcase } from '../../state/useShowcase';
import { IconCatalog } from './IconCatalog';

const log = createLogger('FoundationScene');
const ONE_SHOT_TRANSPORT_ID = 'foundation-scene-one-shot';
const SAFE_LOG_MESSAGE = '主题诊断示例已记录';

const themeItems = [
  { id: 'system', label: '跟随系统' },
  { id: 'light', label: '浅色' },
  { id: 'dark', label: '深色' },
];

const fontScaleItems = [
  { id: '1', label: '标准字号' },
  { id: '1.25', label: '较大字号' },
  { id: '1.5', label: '大字号' },
  { id: '2', label: '超大字号' },
];

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    stack: {
      gap: space['7'],
    },
    facts: {
      gap: space['3'],
    },
    fact: {
      color: colors.foregroundMuted,
      fontSize: type.sm,
    },
    emphasizedFact: {
      color: colors.primary,
    },
    swatches: {
      flexDirection: 'row',
      gap: space['5'],
    },
    swatch: {
      borderRadius: radius.md,
      flex: 1,
      height: control.lg,
    },
    currentShadow: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: space['5'],
    },
  });

function runLoggerDiagnostic(): void {
  const previousLevel = getLogLevel();
  let delivered = false;
  const transport: LogTransport = {
    id: ONE_SHOT_TRANSPORT_ID,
    log(record) {
      if (delivered) return;
      if (
        record.scope === 'FoundationScene' &&
        record.message === SAFE_LOG_MESSAGE
      ) {
        delivered = true;
      }
    },
  };

  try {
    setLogLevel('info');
    addTransport(transport);
    log.info(SAFE_LOG_MESSAGE);
  } finally {
    removeTransport(ONE_SHOT_TRANSPORT_ID);
    setLogLevel(previousLevel);
  }
}

export function FoundationScene(): React.JSX.Element {
  const { back, setFontScale, setThemeMode, state, updateScene } =
    useShowcase();
  const theme = useTheme();
  const colors = useColors();
  const shadow = useShadow();
  const fontScale = useFontScale();
  const reducedMotion = usePrefersReducedMotion();
  const styles = useThemedStyles(makeStyles);
  const normalizedFontScale = normalizeFontScale(fontScale);
  const scaledBody = scaleFontMetric(type.body, fontScale);
  const iconDataComplete = ICON_NAMES.every(
    (name) => ICONS[name] !== undefined
  );
  const draft = state.scenes.foundation;
  const schemeLabel = theme.scheme === 'dark' ? '深色' : '浅色';

  return (
    <ShowcaseScaffold
      title="基础能力与图标"
      scene="foundation"
      onBack={() => {
        back();
      }}
      testID="foundation-screen"
    >
      <View style={styles.stack}>
        <SectionCard
          title="运行时事实"
          description="以下内容直接读取当前 ThemeProvider 与系统动态效果偏好。"
        >
          <View style={styles.facts}>
            <Text style={styles.fact}>当前主题：{schemeLabel}</Text>
            <Text style={styles.fact}>字号倍率：{fontScale}</Text>
            <Text style={styles.fact}>
              减少动态效果：{reducedMotion ? '是' : '否'}
            </Text>
            <Text style={styles.fact}>当前日志等级：{getLogLevel()}</Text>
            <Text style={styles.fact}>控制台传输器：{consoleTransport.id}</Text>
            <Text style={styles.fact}>
              图标诊断：{ICON_NAMES.length} /{' '}
              {iconDataComplete ? '数据完整' : '数据缺失'}
            </Text>
          </View>
        </SectionCard>

        <SectionCard title="主题与字号控制">
          <Segmented
            value={state.themeMode}
            items={themeItems}
            onChange={(value) => {
              if (isThemeMode(value)) setThemeMode(value);
            }}
            testID="foundation-theme-mode"
          />
          <Segmented
            value={String(state.fontScale)}
            items={fontScaleItems}
            onChange={(value) => {
              const next = Number(value);
              if (isFontScalePreset(next)) setFontScale(next);
            }}
            testID="foundation-font-scale"
          />
        </SectionCard>

        <SectionCard title="配对 token 与指标">
          <View style={styles.facts}>
            <Text style={[styles.fact, styles.emphasizedFact]}>
              配对色板：浅色 {lightColors.primary} / 深色 {darkColors.primary}
            </Text>
            <View
              style={styles.swatches}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: lightColors.background },
                ]}
                testID="foundation-swatch-light"
              />
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: darkColors.background },
                ]}
                testID="foundation-swatch-dark"
              />
            </View>
            <Text style={styles.fact} testID="foundation-shadow-metrics">
              阴影：浅色 card {lightShadow.card.shadowOpacity} / 深色 card{' '}
              {darkShadow.card.shadowOpacity} / 当前 subtle{' '}
              {shadow.subtle.shadowOpacity}
            </Text>
            <View style={[styles.currentShadow, shadow.subtle]}>
              <Text style={styles.fact}>当前主题 surface 层级</Text>
            </View>
            <Text style={styles.fact} testID="foundation-palette-metrics">
              调色板：暖橙 {warmOrangePalette.light.length}/
              {warmOrangePalette.dark.length} stops；品牌 {BRAND_ORANGE}
              ；头像渐变 {avatarGradient.length} stops
            </Text>
            <Text style={styles.fact} testID="foundation-token-metrics">
              Token：{fontMono ?? '系统默认'} / body {type.body} / semi{' '}
              {fw.semi} / space {space['4']} / radius {radius.md} / avatar{' '}
              {avatar.md} / icon {icon.md} / control {control.lg} / dim{' '}
              {dim.sendBtn} / fixed {fixed.hitTarget} / motion {motion.base} /
              opacity {pressedOpacity} / blur {blur.soft}-{blur.strong}
            </Text>
            <Text style={styles.fact} testID="foundation-scale-metrics">
              缩放：r(8)={r(8)} / rf(15)={rf(15)} / normalize=
              {normalizedFontScale} / dynamic body={scaledBody}
            </Text>
            <Text style={styles.fact}>当前 primary：{colors.primary}</Text>
          </View>
        </SectionCard>

        <SectionCard
          title="Logger 诊断"
          description="仅记录固定安全消息，不收集输入、URI 或路径。"
        >
          <Button
            label="记录主题诊断"
            onPress={runLoggerDiagnostic}
            leftIcon="clipboard"
          />
        </SectionCard>

        <IconCatalog
          draft={draft}
          updateDraft={(updater) => updateScene('foundation', updater)}
        />
      </View>
    </ShowcaseScaffold>
  );
}
