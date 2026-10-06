import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  GlassLayer,
  Button,
  CircularProgress,
  Empty,
  Pulse,
  PulseDot,
  Reveal,
  Segmented,
  Skeleton,
  Spinner,
  confirm,
  type ColorTokens,
  type GlassEffect,
  type ToastKind,
  type ToastPosition,
  radius,
  space,
  toast,
  type,
  useColors,
  usePrefersReducedMotion,
  usePulse,
  useThemedStyles,
} from '@unif/react-native-design';
import { ShowcaseScaffold } from '../../shared/ShowcaseScaffold';
import { SectionCard } from '../../shared/SectionCard';
import { useShowcase } from '../../state/useShowcase';

const revealDurationItems = [
  { id: '0', label: '立即显示' },
  { id: '200', label: '标准淡入' },
  { id: '500', label: '慢速淡入' },
];
const revealDurationValues = {
  '0': 0,
  '200': 200,
  '500': 500,
} as const;
const glassEffectItems = [
  { id: 'clear', label: '通透玻璃' },
  { id: 'regular', label: '标准玻璃' },
];
const toastKinds: readonly Readonly<{
  kind: ToastKind;
  label: string;
}>[] = [
  { kind: 'info', label: '信息' },
  { kind: 'success', label: '成功' },
  { kind: 'error', label: '错误' },
];
const toastPositions: readonly Readonly<{
  position: ToastPosition;
  label: string;
}>[] = [
  { position: 'top', label: '顶部' },
  { position: 'center', label: '居中' },
  { position: 'bottom', label: '底部' },
];

const makeStyles = (colors: ColorTokens) =>
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
    skeletonStack: {
      gap: space['4'],
    },
    fact: {
      color: colors.foregroundMuted,
      fontSize: type.sm,
    },
    pulseSpecimen: {
      backgroundColor: colors.primaryContainer,
      borderRadius: radius.md,
      padding: space['5'],
    },
    pulseText: {
      color: colors.foreground,
      fontSize: type.sm,
    },
    revealSpecimen: {
      backgroundColor: colors.surfaceContainer,
      borderRadius: radius.md,
      padding: space['4'],
    },
    loading: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: space['4'],
    },
    glassLayer: { borderRadius: radius.lg },
    glassContainer: {
      alignItems: 'center',
      backgroundColor: colors.primaryContainer,
      borderRadius: radius.lg,
      height: 120,
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    },
    glassContent: {
      color: colors.foreground,
      fontSize: type.sm,
    },
  });

function isRevealDuration(value: string): value is '0' | '200' | '500' {
  return value === '0' || value === '200' || value === '500';
}

function isGlassEffect(value: string): value is GlassEffect {
  return value === 'clear' || value === 'regular';
}

function showToast(
  kind: ToastKind,
  position: ToastPosition,
  message: string
): void {
  const input = { message, position, duration: 10_000 };
  switch (kind) {
    case 'info':
      toast.info(input);
      return;
    case 'success':
      toast.success(input);
      return;
    case 'error':
      toast.error(input);
  }
}

export function FeedbackScene(): React.JSX.Element {
  const { appendResult, back, state, updateScene } = useShowcase();
  const colors = useColors();
  const reducedMotion = usePrefersReducedMotion();
  const pulseStyle = usePulse({
    from: 0.32,
    to: 0.92,
    duration: 700,
    delay: 0,
  });
  const styles = useThemedStyles(makeStyles);
  const draft = state.scenes.feedback;
  const record = (component: string, action: string, summary: string) => {
    appendResult({ scene: 'feedback', component, action, summary });
  };
  const runConfirm = async (destructive: boolean): Promise<void> => {
    const accepted = await confirm(
      destructive
        ? {
            title: '删除示例记录？',
            message: '该操作只影响本地示例结果。',
            confirmLabel: '确认删除',
            cancelLabel: '保留内容',
            destructive: true,
          }
        : {
            title: '继续当前操作？',
            message: '请确认是否继续演示。',
            confirmLabel: '确认继续',
            cancelLabel: '取消操作',
          }
    );
    record(
      'Confirm',
      destructive ? '破坏性确认' : '普通确认',
      accepted ? '已确认' : '已取消'
    );
  };
  const runReentrantConfirm = async (): Promise<void> => {
    const first = confirm({
      title: '第一个连续确认',
      message: '第一个请求保持 active，直到用户明确结算。',
      confirmLabel: '完成第一个请求',
      cancelLabel: '取消第一个请求',
    });
    const second = confirm({
      title: '第二个连续确认',
      message: '该请求应被重入保护立即拒绝。',
    });
    const secondAccepted = await second;
    record(
      'ConfirmHost',
      '重入保护',
      secondAccepted
        ? '第二个请求异常返回 true'
        : '第二个请求已返回 false；第一个仍待处理'
    );
    const firstAccepted = await first;
    record(
      'ConfirmHost',
      '重入结算',
      firstAccepted ? '第一个请求已确认' : '第一个请求已取消'
    );
  };

  return (
    <ShowcaseScaffold
      title="反馈与浮层"
      scene="feedback"
      onBack={() => {
        back();
      }}
      testID="feedback-screen"
    >
      <View style={styles.stack}>
        <SectionCard title="空态与加载">
          <Empty
            title="暂无反馈记录"
            desc="触发下方动作后可在结果面板查看安全摘要。"
            icon="clipboard"
            testID="feedback-empty-data-boundary"
          />
          <View style={styles.skeletonStack}>
            <Skeleton shape="line" testID="feedback-skeleton-line" />
            <Skeleton
              shape="rect"
              height={72}
              testID="feedback-skeleton-rect"
            />
            <Skeleton
              shape="circle"
              size={40}
              testID="feedback-skeleton-circle"
            />
          </View>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="正在加载示例"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
            style={styles.loading}
          >
            <Spinner
              size={24}
              color={colors.primary}
              thickness={3}
              testID="feedback-spinner"
            />
            <Text style={styles.fact}>加载中</Text>
          </View>
          <View style={styles.row}>
            <CircularProgress
              value={0.42}
              accessibilityLabel="文件上传进度"
              testID="feedback-circular-progress-ring"
            />
            <CircularProgress
              value={0.68}
              showLabel
              accessibilityLabel="含百分比的文件上传进度"
              testID="feedback-circular-progress-label"
            />
            <CircularProgress
              value={1}
              size={16}
              thickness={2}
              showLabel
              accessibilityLabel="小圆环大字号样例"
            />
          </View>
        </SectionCard>

        <SectionCard title="动态效果">
          <Text style={styles.fact}>
            减少动态效果：{reducedMotion ? '是' : '否'}
          </Text>
          <Text style={styles.fact}>
            脉冲与淡入遵循系统设置；加载指示仍保持旋转。
          </Text>
          <View style={styles.row}>
            <Pulse testID="feedback-pulse-default">
              <Text style={styles.pulseText}>默认脉冲</Text>
            </Pulse>
            <Pulse
              from={0.45}
              to={1}
              duration={700}
              delay={0}
              style={styles.pulseSpecimen}
              testID="feedback-pulse"
            >
              <Text style={styles.pulseText}>脉冲内容保持可读</Text>
            </Pulse>
            <PulseDot
              from={0.5}
              to={1}
              duration={500}
              testID="feedback-pulse-dot"
            />
            <PulseDot testID="feedback-pulse-dot-default" />
            <PulseDot
              size={12}
              color={colors.success}
              testID="feedback-pulse-dot-size-color"
            />
            <Animated.View
              style={[styles.pulseSpecimen, pulseStyle]}
              testID="feedback-use-pulse"
            >
              <Text style={styles.pulseText}>公开 Hook 脉冲</Text>
            </Animated.View>
          </View>
          <Segmented
            value={String(draft.revealDuration)}
            items={revealDurationItems}
            onChange={(value) => {
              if (!isRevealDuration(value)) return;
              updateScene('feedback', (current) => ({
                ...current,
                revealDuration: revealDurationValues[value],
              }));
            }}
          />
          <Button
            label={draft.revealVisible ? '隐藏淡入内容' : '显示淡入内容'}
            variant="secondary"
            onPress={() =>
              updateScene('feedback', (current) => ({
                ...current,
                revealVisible: !current.revealVisible,
              }))
            }
          />
          {draft.revealVisible ? (
            <Reveal
              duration={draft.revealDuration}
              style={styles.revealSpecimen}
              testID="feedback-reveal"
            >
              <Text style={styles.fact}>淡入内容已显示</Text>
            </Reveal>
          ) : null}
        </SectionCard>

        <SectionCard
          title="玻璃材质"
          description="仅在用户明确操作后挂载 GlassLayer 组件。"
        >
          <Text style={styles.fact}>
            iOS 26+ 使用原生玻璃；旧 iOS 和 Android 使用半透明背景，Web 使用 CSS
            近似效果。原生视觉效果需在设备上验证。
          </Text>
          <Segmented
            value={draft.glassEffect}
            items={glassEffectItems}
            onChange={(value) => {
              if (!isGlassEffect(value)) return;
              updateScene('feedback', (current) => ({
                ...current,
                glassEffect: value,
              }));
            }}
          />
          <Button
            label={
              draft.glassDemoEnabled
                ? '卸载 GlassLayer 演示'
                : '挂载 GlassLayer 演示'
            }
            variant="secondary"
            onPress={() =>
              updateScene('feedback', (current) => ({
                ...current,
                glassDemoEnabled: !current.glassDemoEnabled,
              }))
            }
          />
          <View style={styles.glassContainer} testID="feedback-glass-container">
            {draft.glassDemoEnabled ? (
              <GlassLayer
                effect={draft.glassEffect}
                tintColor={colors.glassTintLight}
                style={styles.glassLayer}
                testID="feedback-glass-layer"
              />
            ) : null}
            <Text style={styles.glassContent}>
              {draft.glassDemoEnabled
                ? 'GlassLayer 组件已挂载'
                : 'GlassLayer 组件未挂载'}
            </Text>
          </View>
        </SectionCard>

        <SectionCard
          title="Toast 轻提示"
          description="命令式 API 返回 void，页面只记录已发起展示请求。"
        >
          <View style={styles.row}>
            {toastKinds.flatMap(({ kind, label: kindLabel }) =>
              toastPositions.map(({ position, label: positionLabel }) => {
                const message = `${kindLabel}提示 · ${positionLabel}`;
                return (
                  <Button
                    key={`${kind}-${position}`}
                    label={`展示${kindLabel}${positionLabel}提示`}
                    size="sm"
                    variant="secondary"
                    onPress={() => {
                      updateScene('feedback', (current) => ({
                        ...current,
                        toastKind: kind,
                        toastPosition: position,
                      }));
                      showToast(kind, position, message);
                      record(
                        'Toast',
                        '请求展示',
                        `已请求展示：${kindLabel}、${positionLabel}`
                      );
                    }}
                  />
                );
              })
            )}
          </View>
        </SectionCard>

        <SectionCard
          title="Confirm 确认"
          description="页面等待 Promise 结算后再记录确认或取消事实。"
        >
          <View style={styles.row}>
            <Button
              label="打开普通确认"
              onPress={() => {
                runConfirm(false).catch(() => undefined);
              }}
            />
            <Button
              label="打开破坏性确认"
              variant="danger"
              onPress={() => {
                runConfirm(true).catch(() => undefined);
              }}
            />
            <Button
              label="连续调用两次 Confirm"
              variant="secondary"
              testID="feedback-confirm-reentrant"
              onPress={() => {
                runReentrantConfirm().catch(() => undefined);
              }}
            />
          </View>
        </SectionCard>
      </View>
    </ShowcaseScaffold>
  );
}
