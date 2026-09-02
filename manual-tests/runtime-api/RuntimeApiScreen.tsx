import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  AvatarWithRing,
  Button,
  Carousel,
  Cell,
  Checkbox,
  ConfirmHost,
  DrawerHeader,
  GradientWash,
  Grid,
  Icon,
  IconButton,
  Input,
  List,
  Logo,
  NavBar,
  PasswordInput,
  Pulse,
  PulseDot,
  Radio,
  RadialHalo,
  Reveal,
  Search,
  Segmented,
  Skeleton,
  Spinner,
  Stepper,
  Switch,
  Tag,
  Textarea,
  ThemeProvider,
  Thumbnail,
  ToastHost,
  VersionPill,
  confirm,
  r,
  toast,
  useColors,
  useFontScale,
  usePrefersReducedMotion,
  useSvgId,
  useTheme,
  type NavBarSlot,
  type TextFieldSlot,
} from '@unif/react-native-design';

const NAV_BAR_PROMISE_SLOT = Promise.resolve('Promise primitive') as NavBarSlot;
const INPUT_ERROR_STATES = [
  '',
  '错误 A：请输入有效内容',
  '错误 B：内容格式仍不正确',
] as const;

/**
 * Runtime API 人工验证屏 —— 由 `yarn create:runtime-harness` 拷进临时的
 * RN 0.87.1 app 里跑,**不属于任何自动化测试**。
 *
 * 它只 import 包根 barrel(与真实消费者一致),用来验证 Jest 覆盖不到的部分:
 * 真实 native / Web 结构、44pt 命中框、a11y tree、reduced motion 和竞态。
 *
 * 每个交互结果都渲染成可见文本 —— 人工验收时逐条对照 verification matrix 记录。
 */
export function RuntimeApiScreen(): React.JSX.Element {
  const [confirmResult, setConfirmResult] = useState('—');
  const [reentryResult, setReentryResult] = useState('—');
  // ToastHost 可开关 —— 用来验证「Host 挂上前发布的消息会补投」以及「owner 重挂后重投递」
  const [toastHostOn, setToastHostOn] = useState(false);
  const [toastHostKey, setToastHostKey] = useState(0);
  const [controlledInput, setControlledInput] = useState('受控初值');
  const [modeSwitched, setModeSwitched] = useState(false);
  const [errorIndex, setErrorIndex] = useState(0);
  const [search, setSearch] = useState('查询');
  const [searchResult, setSearchResult] = useState('—');
  const [buttonPresses, setButtonPresses] = useState(0);
  const [unexpectedPresses, setUnexpectedPresses] = useState(0);
  const [navBarAction, setNavBarAction] = useState('—');
  const [missingThemeProbeVisible, setMissingThemeProbeVisible] =
    useState(false);
  const error = INPUT_ERROR_STATES[errorIndex] ?? '';
  const modeSwitchProps = modeSwitched
    ? { value: '后来受控', onChangeText: setControlledInput }
    : { defaultValue: '首次非受控' };

  const runConfirm = async () => {
    const result = await confirm({
      title: 'Runtime Confirm',
      message: '验证 settle',
    });
    setConfirmResult(String(result));
  };

  /** 重入:第二次调用必须立刻 false,且第一个对话框仍然停在屏幕上。 */
  const runReentry = () => {
    setReentryResult('pending');
    confirm({ title: 'Reentry A', message: '这个应当保持显示' }).then(
      (result) => setConfirmResult(`A=${String(result)}`)
    );
    confirm({ title: 'Reentry B', message: '这个应当被立即拒绝' }).then(
      (result) => setReentryResult(`B=${String(result)}`)
    );
  };

  const runDestructive = async () => {
    const result = await confirm({
      title: '确认删除?',
      message: '破坏性操作:确认按钮应为红色',
      confirmLabel: '删除',
      destructive: true,
    });
    setConfirmResult(`destructive=${String(result)}`);
  };

  const runBlankConfirmLabels = async () => {
    const result = await confirm({
      title: '空白按钮文案回退',
      confirmLabel: '   ',
      cancelLabel: '\t',
    });
    setConfirmResult(`blank-labels=${String(result)}`);
  };

  // 显式 unknown seam：模拟 JS 消费者绕过 TypeScript 传入的伪 React object。
  // 它必须在 effect 中给出 Metro warning、渲染为空，且绝不调用其中 handler。
  const malformedNavBarSlot: unknown = {
    $$typeof: Symbol.for('react.transitional.element'),
    icon: 'not-generated-icon',
    onPress: () => setNavBarAction('错误：无效 action 被调用'),
    accessibilityLabel: '无效 action',
  };
  const malformedNavBarLeft = malformedNavBarSlot as NavBarSlot;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content}>
              <Section title="Confirm">
                <Button label="打开 Confirm" onPress={runConfirm} />
                <Button
                  label="重入(A 保持 / B 立即 false)"
                  variant="secondary"
                  onPress={runReentry}
                />
                <Button
                  label="破坏性 Confirm"
                  variant="danger"
                  onPress={runDestructive}
                />
                <Button
                  label="空白 Confirm label（应显示确认 / 取消）"
                  variant="secondary"
                  onPress={runBlankConfirmLabels}
                />
                <Result label="confirm 结果" value={confirmResult} />
                <Result label="重入 B 结果" value={reentryResult} />
              </Section>

              <Section title="Button / IconButton / NavBar action 与 a11y">
                <Text style={styles.result}>
                  用 Inspector 或 screen reader 确认 disabled / loading 均移除
                  handler 并上报 disabled；loading 额外上报 busy。点击 enabled
                  操作应递增，disabled/loading/blank Button 与 blank IconButton
                  均不得递增 unexpected 计数；两个 blank action 不应形成 unnamed
                  button，并各自在 effect 输出诊断。
                </Text>
                <Button
                  label="enabled Button"
                  testID="action-button-enabled"
                  onPress={() => setButtonPresses((count) => count + 1)}
                />
                <Button
                  label="disabled Button（不应触发）"
                  disabled
                  testID="action-button-disabled"
                  onPress={() => setUnexpectedPresses((count) => count + 1)}
                />
                <Button
                  label="loading Button（不应触发）"
                  loading
                  testID="action-button-loading"
                  onPress={() => setUnexpectedPresses((count) => count + 1)}
                />
                <Button
                  label="   "
                  testID="action-button-blank"
                  onPress={() => setUnexpectedPresses((count) => count + 1)}
                />
                <IconButton
                  icon="check"
                  accessibilityLabel="enabled IconButton"
                  testID="action-icon-enabled"
                  onPress={() => setButtonPresses((count) => count + 1)}
                />
                <IconButton
                  icon="close"
                  accessibilityLabel={'\t'}
                  testID="action-icon-blank"
                  onPress={() => setUnexpectedPresses((count) => count + 1)}
                />
                <IconButton
                  icon="close"
                  accessibilityLabel="loading IconButton（不应触发）"
                  loading
                  testID="action-icon-loading"
                  onPress={() => setUnexpectedPresses((count) => count + 1)}
                />
                <Result label="enabled actions" value={String(buttonPresses)} />
                <Result
                  label="disabled/loading actions"
                  value={String(unexpectedPresses)}
                />
                <View style={styles.navBarFrame}>
                  <NavBar
                    title="合法 action + display node 0"
                    left={{
                      icon: 'arrow-left',
                      accessibilityLabel: '返回',
                      onPress: () => setNavBarAction('合法 action 已触发'),
                    }}
                    right={0}
                  />
                </View>
                <View style={styles.navBarFrame}>
                  <NavBar
                    title="display ReactNode"
                    right={<Text>只读节点</Text>}
                  />
                </View>
                <View style={styles.navBarFrame}>
                  <NavBar
                    title="Fragment primitive"
                    right={
                      <>
                        Fragment primitive
                        <React.Fragment> + nested</React.Fragment>
                      </>
                    }
                  />
                </View>
                <View style={styles.navBarFrame}>
                  <Suspense fallback={<Text>Promise loading</Text>}>
                    <NavBar
                      title="stable Promise primitive"
                      right={NAV_BAR_PROMISE_SLOT}
                    />
                  </Suspense>
                </View>
                <View style={styles.navBarFrame}>
                  <NavBar
                    title="无类型 malformed action 应为空"
                    left={malformedNavBarLeft}
                  />
                </View>
                <Result label="NavBar action" value={navBarAction} />
                <Text style={styles.result}>
                  malformed NavBar 在首次挂载后应只在 Metro 输出一次警告，left
                  slot 不显示。Fragment 的两段 primitive 与 stable Promise
                  primitive 都应显示为 Text，不触发 native raw text
                  错误；Promise 必须由当前 Suspense 稳定完成，不能永久停在
                  fallback。
                </Text>
              </Section>

              <FontScaleSection
                onOpenMissingProvider={() => setMissingThemeProbeVisible(true)}
              />

              <ImageSourceAttemptSection />

              <ThumbnailSection />

              <AnimationContainersSection />

              <SvgIdSection />

              <Section title="Toast">
                <Button
                  label="① Host 关闭时发布(应保留到挂上再显示)"
                  variant="secondary"
                  onPress={() => toast('pending-before-host')}
                />
                <Button
                  label="② 快速发 A 再发 B(只应看到 B)"
                  variant="secondary"
                  onPress={() => {
                    toast('A — 不应停留');
                    toast.success('B — 应当显示这条');
                  }}
                />
                <Button
                  label={toastHostOn ? '③ 关闭 ToastHost' : '③ 打开 ToastHost'}
                  onPress={() => setToastHostOn((on) => !on)}
                />
                <Button
                  label="④ 重挂 ToastHost(未播完的应重投递)"
                  variant="secondary"
                  onPress={() => setToastHostKey((key) => key + 1)}
                />
                <Result
                  label="ToastHost"
                  value={toastHostOn ? `on (#${toastHostKey})` : 'off'}
                />
              </Section>

              <Section title="严格文本输入 / a11y">
                <Text style={styles.result}>
                  以下项目用于人工确认受控/非受控、44pt action frame、归一化和
                  iOS 错误播报。malformed-text-slot 必须为空并在 effect 诊断。
                  错误按钮依次走空→A→B→空，用于确认 iOS 初次 A 播报及 A→B
                  重新播报。
                </Text>
                <Input
                  defaultValue="只在首次初始化"
                  placeholder="非受控 defaultValue"
                  accessibilityLabel="非受控初始化"
                />
                <Input
                  value={controlledInput}
                  onChangeText={setControlledInput}
                  placeholder="受控编辑"
                  accessibilityLabel="受控编辑"
                />
                <Button
                  label="切换非受控为受控（应在 Metro 诊断且保持初始 mode）"
                  variant="secondary"
                  onPress={() => setModeSwitched(true)}
                />
                <Input
                  {...modeSwitchProps}
                  placeholder="mode lock"
                  accessibilityLabel="mode lock"
                />
                <Input
                  defaultValue=""
                  disabled
                  trailing={{
                    kind: 'action',
                    icon: 'close',
                    onPress: () => setControlledInput('不应触发'),
                    accessibilityLabel: '禁用操作',
                  }}
                  testID="disabled-slot"
                />
                <Input
                  defaultValue=""
                  trailing={{
                    kind: 'action',
                    icon: 'close',
                    onPress: () => setControlledInput('action'),
                    accessibilityLabel: '44pt 操作',
                  }}
                  testID="action-frame-44"
                />
                <Input
                  defaultValue=""
                  leading={
                    {
                      kind: 'text',
                      value: { malformed: true },
                    } as unknown as TextFieldSlot
                  }
                  placeholder="malformed text slot 应移除并 effect 诊断"
                  testID="malformed-text-slot"
                />
                <Input
                  defaultValue=""
                  height={20}
                  placeholder="非法 height=20（应回退 44）"
                />
                <Textarea
                  defaultValue=""
                  minHeight={20}
                  maxHeight={10}
                  placeholder="非法 min/max（应回退 96 / 无上限）"
                />
                <PlaceholderPriorityCase />
                <Button
                  label="循环错误：空 → A → B → 空"
                  variant="secondary"
                  onPress={() =>
                    setErrorIndex(
                      (current) => (current + 1) % INPUT_ERROR_STATES.length
                    )
                  }
                />
                <Input
                  defaultValue=""
                  error={error}
                  placeholder="iOS 错误播报"
                  accessibilityLabel="iOS 错误播报"
                />
                <Search
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={() => setSearchResult(() => 'native')}
                  onSubmit={(value) =>
                    setSearchResult(
                      (previous) => `${previous} → convenience: ${value}`
                    )
                  }
                  accessibilityLabel="搜索"
                />
                <Result label="Search submit" value={searchResult} />
                <PasswordInput
                  value="password"
                  onChangeText={() => {}}
                  disabled
                  accessibilityLabel="禁用密码操作"
                />
              </Section>

              <SelectionControlsSection />

              <StepperSection />

              <CellSection />

              <DisplaySemanticsSection />

              <CarouselSection />

              <PulseSection />
            </ScrollView>
          </SafeAreaView>

          {/* ConfirmHost 全屏挂一个 —— owner 是栈式的,再挂会接管而非惰性。 */}
          <ConfirmHost />
          {toastHostOn ? (
            <ToastHost key={toastHostKey} testID="toast-host" />
          ) : null}
        </ThemeProvider>
        <Modal
          visible={missingThemeProbeVisible}
          animationType="none"
          onRequestClose={() => setMissingThemeProbeVisible(false)}
        >
          <SafeAreaView style={styles.missingThemeModal}>
            <MissingThemeProviderProbe
              onClose={() => setMissingThemeProbeVisible(false)}
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * fontScale:render-time dynamic metric 与 maker metric 都只缩放一次。
 *
 * Inspector 对比 normal / valid-1.5 / invalid-NaN / large-3：合法值原样保留，
 * 非法值回退 1。Button 内 Icon 和独立 20pt Icon、Avatar/AvatarWithRing 直径、
 * Segmented track、Stepper visual/outer（md/sm 三块至少 44pt；xs 为
 * 24×44 / 40×44 / 24×44）、Tag 高度及 ruler 都保持原几何。
 */
function FontScaleSection({
  onOpenMissingProvider,
}: {
  onOpenMissingProvider: () => void;
}): React.JSX.Element {
  return (
    <Section title="fontScale normalization / typography / fallback">
      <Text style={styles.result}>
        用 Inspector 并排测量 normal / valid-1.5 / invalid-NaN /
        large-3：invalid 必须回退 1，large 必须保留
        3（不设上限）。Button、Avatar、 Segmented、Stepper、Tag、AvatarWithRing
        的文字按归一化值放大且只放大一次。Button 内 Icon 与 standalone Icon
        均不得放大；所有容器、padding 和圆角保持原值。Stepper md/sm 三块 outer
        至少 44pt，xs 保持 24×44 / 40×44 / 24×44，visual frame、Tag 高度和 ruler
        几何不变。真实 native/Web 测量前不得记为 PASS。
      </Text>
      <FontScaleSample id="normal" fontScale={1} expectedScale={1} />
      <FontScaleSample id="valid-1-5" fontScale={1.5} expectedScale={1.5} />
      <FontScaleSample
        id="invalid-nan"
        fontScale={Number.NaN}
        expectedScale={1}
      />
      <FontScaleSample id="large-3" fontScale={3} expectedScale={3} />
      <Button
        label="打开缺 ThemeProvider fallback probe"
        variant="secondary"
        onPress={onOpenMissingProvider}
        testID="open-missing-theme-provider-probe"
      />
    </Section>
  );
}

function FontScaleSample({
  id,
  fontScale,
  expectedScale,
}: {
  id: string;
  fontScale: number;
  expectedScale: number;
}): React.JSX.Element {
  const [segment, setSegment] = useState('first');
  const [stepper, setStepper] = useState(1);

  return (
    <ThemeProvider fontScale={fontScale}>
      <View style={styles.fontScaleSample} testID={`font-scale-${id}`}>
        <FontScaleValueProbe id={id} expectedScale={expectedScale} />
        <Button
          label={`Button ${id}`}
          leftIcon="check"
          onPress={() => {}}
          testID={`font-scale-${id}-button`}
        />
        <Icon
          name="check"
          size={20}
          testID={`font-scale-${id}-standalone-icon`}
        />
        <Avatar
          label="字"
          size="lg"
          variant="brand"
          testID={`font-scale-${id}-avatar`}
        />
        <Segmented
          value={segment}
          onChange={setSegment}
          items={[
            { id: 'first', label: '选项一' },
            { id: 'second', label: '选项二' },
          ]}
          testID={`font-scale-${id}-segmented`}
        />
        <Stepper
          value={stepper}
          onChange={setStepper}
          min={0}
          max={9}
          accessibilityLabel={`fontScale ${id} 数量`}
          testID={`font-scale-${id}-stepper`}
        />
        <Tag label={`Tag ${id}`} testID={`font-scale-${id}-tag`} />
        <AvatarWithRing
          label="字"
          size={64}
          testID={`font-scale-${id}-avatar-with-ring`}
        />
        <View style={styles.fontScaleRuler} testID={`font-scale-${id}-ruler`} />
      </View>
    </ThemeProvider>
  );
}

function FontScaleValueProbe({
  id,
  expectedScale,
}: {
  id: string;
  expectedScale: number;
}): React.JSX.Element {
  const normalizedScale = useFontScale();
  return (
    <Result
      label={`fontScale ${id}`}
      value={`normalized=${normalizedScale}; expected=${expectedScale}`}
    />
  );
}

/**
 * 该组件只挂在 ThemeProvider 兄弟 Modal 中，确保 React context 路径上没有 Provider。
 * 首帧必须先用稳定 light fallback 渲染，dev 诊断随后才由 effect 发出。
 */
function MissingThemeProviderProbe({
  onClose,
}: {
  onClose: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const initialTheme = useRef(theme);
  const [rerenders, setRerenders] = useState(0);

  return (
    <View
      style={[
        styles.missingThemeProbe,
        { backgroundColor: theme.colors.background },
      ]}
      testID="missing-theme-provider-probe"
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Missing ThemeProvider fallback
      </Text>
      <Result
        label="missing provider"
        value={`scheme=${theme.scheme}; fontScale=${theme.fontScale}; stable=${String(
          initialTheme.current === theme
        )}; rerenders=${rerenders}`}
      />
      <Text style={[styles.result, { color: theme.colors.foregroundMuted }]}>
        首次内容必须正常显示，再在 effect 后输出一次 dev 诊断；点击重渲染后
        stable 仍为 true，且不得重复诊断。真实日志与首帧未核验前不得记 PASS。
      </Text>
      <Button
        label="重渲染 fallback probe"
        onPress={() => setRerenders((count) => count + 1)}
      />
      <Button
        label="关闭 fallback probe"
        variant="secondary"
        onPress={onClose}
      />
    </View>
  );
}

const DISPLAY_IMAGE_SOURCE = {
  uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
} as const;

type ImageAttemptStep = 'a1' | 'b' | 'a2';

/**
 * 图片 attempt identity 与 ABA 隔离。
 *
 * `yarn runtime:image-fixture` 提供:
 * - GET /equivalent.png?run=N:保持 pending，release 前可核对等价 render 没有重发。
 * - POST /release-equivalent?run=N:让当前 pending equivalent 请求返回合法 PNG。
 * - GET /aba.png?run=N:同一 run 第 1 次请求保持 pending，第 2 次返回合法 PNG。
 * - POST /release-a1?run=N:让该 run 仍 pending 的第 1 次 /aba.png 返回错误。
 * - GET /status?run=N:返回 request / abort / pending / release 计数。
 *
 * 真实 fixture、native/Web Image 事件和可见结果均实际核验前，本区只能记 BLOCKED。
 */
function ImageSourceAttemptSection(): React.JSX.Element {
  const [fixtureOriginDraft, setFixtureOriginDraft] = useState('');
  const [fixtureOrigin, setFixtureOrigin] = useState('');
  const [fixtureRun, setFixtureRun] = useState(0);
  const [equivalentRevision, setEquivalentRevision] = useState(0);
  const [step, setStep] = useState<ImageAttemptStep>('a1');
  const [equivalentReleaseResult, setEquivalentReleaseResult] = useState('—');
  const [releaseResult, setReleaseResult] = useState('—');
  const [fixtureStatus, setFixtureStatus] = useState('—');
  const origin = fixtureOrigin.trim().replace(/\/+$/u, '');
  const runQuery = `run=${fixtureRun}`;
  const equivalentSource = {
    uri: origin.length > 0 ? `${origin}/equivalent.png?${runQuery}` : ' ',
    headers: { Accept: 'image/png' },
    cache: 'reload' as const,
  };
  const sourceA = {
    uri: origin.length > 0 ? `${origin}/aba.png?${runQuery}` : ' ',
    headers: { Accept: 'image/png' },
    width: 1,
    height: 1,
    scale: 1,
    cache: 'reload' as const,
  };
  const abaSource = step === 'b' ? DISPLAY_IMAGE_SOURCE : sourceA;
  const invalidNestedSource = {
    uri: origin.length > 0 ? `${origin}/must-not-request.png?${runQuery}` : ' ',
    headers: { token: Symbol('invalid-header') },
  } as never;

  const applyFixtureOrigin = () => {
    setFixtureOrigin(fixtureOriginDraft);
    setFixtureRun((run) => run + 1);
    setEquivalentRevision(0);
    setStep('a1');
    setEquivalentReleaseResult('—');
    setReleaseResult('—');
    setFixtureStatus('—');
  };

  const releaseEquivalent = async () => {
    if (origin.length === 0) {
      setEquivalentReleaseResult('fixture origin 为空');
      return;
    }

    try {
      const response = await fetch(`${origin}/release-equivalent?${runQuery}`, {
        method: 'POST',
      });
      setEquivalentReleaseResult(
        `HTTP ${response.status} ${(await response.text()).trim()}`
      );
    } catch (error) {
      setEquivalentReleaseResult(
        error instanceof Error ? error.message : 'fixture release failed'
      );
    }
  };

  const releaseLateA1 = async () => {
    if (origin.length === 0) {
      setReleaseResult('fixture origin 为空');
      return;
    }

    try {
      const response = await fetch(`${origin}/release-a1?${runQuery}`, {
        method: 'POST',
      });
      setReleaseResult(`HTTP ${response.status}`);
    } catch (error) {
      setReleaseResult(
        error instanceof Error ? error.message : 'fixture release failed'
      );
    }
  };

  const refreshFixtureStatus = async () => {
    if (origin.length === 0) {
      setFixtureStatus('fixture origin 为空');
      return;
    }

    try {
      const response = await fetch(`${origin}/status?${runQuery}`);
      setFixtureStatus(
        `HTTP ${response.status} ${(await response.text()).trim()}`
      );
    } catch (error) {
      setFixtureStatus(
        error instanceof Error ? error.message : 'fixture status failed'
      );
    }
  };

  return (
    <Section title="Image source identity / attempt ABA">
      <Text style={styles.result}>
        在主仓运行 yarn runtime:image-fixture --host 0.0.0.0 --port 8099。iOS
        simulator / Web 使用 http://127.0.0.1:8099，Android emulator 使用
        http://10.0.2.2:8099，真机使用 host LAN IP。
      </Text>
      <Text style={styles.result}>
        应用新 run 后 equivalent.png 保持 pending；刷新 status 应为 requests=1 /
        aborts=0 / pending=1。点击“等价 A
        新对象”再刷新，计数必须仍相同；这会抓住 RNW 因 onError identity 变化而
        abort + 重发。最后 release equivalent success，头像应显示图片。
      </Text>
      <Text style={styles.result}>
        ABA 用例依次点击 A₁ → B → A₂：A₁ 请求保持 pending，B 显示图片，A₂ 以与
        A₁ 完全相同的 semantic source 发起第 2 次请求并成功。最后点击“释放 A₁
        late error”，A₂ 图片不得回退。Web 在 B 卸载时通常会 abort A₁，因此
        release 可能返回 released=0 / lateReleasesWithoutClient=1；这不代表网络
        触发了旧 handler，旧 closure 不写 A₂ 由 ImageAttempt 单测确定性证明。
      </Text>
      <Text style={styles.result}>
        invalid-nested-avatar / drawer 的 Symbol header 必须直接显示
        fallback，服务端不得收到 must-not-request.png。真实 native/Web 与
        fixture 事件未执行前不得记 PASS。
      </Text>
      <Input
        value={fixtureOriginDraft}
        onChangeText={setFixtureOriginDraft}
        accessibilityLabel="图片 attempt fixture origin"
        placeholder="http://127.0.0.1:8099"
        testID="image-attempt-fixture-origin"
      />
      <Button
        label="应用 fixture origin / 新 run"
        variant="secondary"
        onPress={applyFixtureOrigin}
      />
      <Result label="fixture run" value={String(fixtureRun)} />
      <Row label="等价新对象不重试">
        <Avatar
          label="E"
          source={equivalentSource}
          size="lg"
          testID="image-attempt-equivalent"
        />
        <Button
          label="等价 A 新对象"
          variant="secondary"
          onPress={() => setEquivalentRevision((revision) => revision + 1)}
        />
      </Row>
      <Result
        label="equivalent object revision"
        value={String(equivalentRevision)}
      />
      <View style={styles.imageAttemptControls}>
        <Button label="释放 equivalent success" onPress={releaseEquivalent} />
        <Button
          label="刷新 fixture status"
          variant="secondary"
          onPress={refreshFixtureStatus}
        />
      </View>
      <Result label="release equivalent" value={equivalentReleaseResult} />
      <Row label={`ABA current=${step}`}>
        <Avatar
          label="A"
          source={abaSource}
          size="lg"
          testID={`image-attempt-${step}`}
        />
      </Row>
      <View style={styles.imageAttemptControls}>
        <Button
          label="A₁（首请求 pending）"
          variant="secondary"
          onPress={() => setStep('a1')}
        />
        <Button
          label="B（真实变化）"
          variant="secondary"
          onPress={() => setStep('b')}
        />
        <Button
          label="A₂（与 A₁ 等价）"
          variant="secondary"
          onPress={() => setStep('a2')}
        />
        <Button label="释放 A₁ late error" onPress={releaseLateA1} />
      </View>
      <Result label="release A₁" value={releaseResult} />
      <Result label="fixture status" value={fixtureStatus} />
      <Avatar
        label="I"
        source={invalidNestedSource}
        size="lg"
        testID="invalid-nested-avatar"
      />
      <DrawerHeader
        name="Invalid Nested"
        source={invalidNestedSource}
        testID="invalid-nested-drawer"
      />
    </Section>
  );
}

/**
 * Thumbnail 的 outer layout / inner visual / ring 始终分层。
 *
 * 通过 Inspector 测量 outer testID 与 inner child；本区未在真实 native/Web
 * 运行前只能记 BLOCKED。
 */
function ThumbnailSection(): React.JSX.Element {
  const [selected, setSelected] = useState(false);
  const mdFrameSize = `${r(113)}×${r(67)}`;
  const smFrameSize = `${r(64)}×${r(40)}`;

  return (
    <Section title="Thumbnail stable layout / visual frame / ring">
      <Text style={styles.result}>
        thumbnail-layout-probe 的 outer 固定为 196×112，并带 translate + scale；
        inner visual frame 的 402pt 设计基准为 md 113×67，当前平台必须实测为{' '}
        {mdFrameSize}。图片 opacity=0.45，但宽高/top runtime override
        必须被剔除。切换 selected 前后，公开两层 View、Image attempt/ring
        overlay、outer/inner measured size 和 caller transform
        都不得变化；只允许 ring 由透明切 primary。真实 native/Web Inspector
        未核验前不得记 PASS。
      </Text>
      <View style={styles.row}>
        <Thumbnail
          source={DISPLAY_IMAGE_SOURCE}
          selected={selected}
          containerStyle={styles.thumbnailOuterProbe}
          imageStyle={styles.thumbnailRuntimeImageProbe as never}
          accessibilityLabel="Thumbnail 稳定结构图片"
          testID="thumbnail-layout-probe"
        />
        <Button
          label={selected ? '切换为未选中' : '切换为已选中'}
          variant="secondary"
          onPress={() => setSelected((current) => !current)}
        />
      </View>
      <Result label="thumbnail selected" value={String(selected)} />
      <Text style={styles.result}>
        thumbnail-invalid-placeholder 的空白 URI 必须保留 sm 64×40
        设计基准、当前平台 {smFrameSize} 的 outer + visual frame 和透明
        ring，不挂 Image、不返回 null；dev 诊断必须来自 effect。
      </Text>
      <Thumbnail uri="   " size="sm" testID="thumbnail-invalid-placeholder" />
    </Section>
  );
}

/**
 * Reveal / Spinner 的公开 layout 与内部动画职责。
 *
 * 必须在真实 native/Web Inspector 与 reduced-motion 环境逐项记录；本区存在不代表
 * 已验收，未运行前只能记 BLOCKED。
 */
function AnimationContainersSection(): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const [revealMounted, setRevealMounted] = useState(true);
  const [revealRun, setRevealRun] = useState(0);
  const [revealAction, setRevealAction] = useState('首次挂载');
  const rapidRemountTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(
    new Set()
  );

  const cancelRapidRemount = () => {
    for (const timer of rapidRemountTimersRef.current) {
      clearTimeout(timer);
    }
    rapidRemountTimersRef.current.clear();
  };

  const queueRapidRemountStep = (run: () => void) => {
    const timer = setTimeout(() => {
      rapidRemountTimersRef.current.delete(timer);
      run();
    }, 0);
    rapidRemountTimersRef.current.add(timer);
  };

  useEffect(
    () => () => {
      cancelRapidRemount();
    },
    []
  );

  const unmountReveal = () => {
    cancelRapidRemount();
    setRevealMounted(false);
    setRevealAction('已卸载');
  };

  const remountReveal = () => {
    cancelRapidRemount();
    setRevealMounted(true);
    setRevealRun((run) => run + 1);
    setRevealAction('已挂载并重触发 transition');
  };

  const rapidlyRemountReveal = () => {
    cancelRapidRemount();
    setRevealMounted(false);
    setRevealAction('快速重挂进行中');

    // 两个独立 macrotask 强制产生 mount → keyed remount，第二次发生在 Reveal
    // 的双 RAF 完成前，用于现场确认旧 generation 的 cleanup 不会写入新实例。
    queueRapidRemountStep(() => {
      setRevealMounted(true);
      setRevealRun((run) => run + 1);
      queueRapidRemountStep(() => {
        setRevealRun((run) => run + 1);
        setRevealAction('快速重挂完成');
      });
    });
  };

  return (
    <Section title="Reveal / Spinner platform containers">
      <Text style={styles.result}>
        reveal-layout-probe 必须只有一个公开 RN View，在 flex row
        中占满剩余宽度； 淡入完成后 opacity 必须保持 0.35。未开启 reduced motion
        时必须经过两个独立 RAF；切换/卸载后旧 RAF 不得写入新一轮。开启 reduced
        motion 后重新挂载本屏， 首帧必须直接显示 0.35，且不得注册 RAF /
        transition；再切回未 reduced 时必须直接从 0
        淡入，不能先显示再反向隐藏。当前 reduced=
        {String(reduced)}。真实 native/Web 未核验前不得记 PASS。
      </Text>
      <View style={styles.revealControls}>
        <Button
          label="卸载 Reveal"
          variant="secondary"
          testID="reveal-unmount"
          onPress={unmountReveal}
        />
        <Button
          label="挂载 / 重触发 Reveal"
          variant="secondary"
          testID="reveal-remount"
          onPress={remountReveal}
        />
        <Button
          label="快速重挂 Reveal"
          variant="secondary"
          testID="reveal-rapid-remount"
          onPress={rapidlyRemountReveal}
        />
      </View>
      <Result
        label="Reveal fixture"
        value={`${revealAction}; mounted=${String(revealMounted)}; run=${revealRun}`}
      />
      <View style={styles.revealProbeRow}>
        {revealMounted ? (
          <Reveal
            key={`reveal-${revealRun}`}
            style={styles.revealLayoutProbe}
            duration={600}
            testID="reveal-layout-probe"
          >
            <View style={styles.revealProbeContent}>
              <Text>Reveal flex + opacity 0.35</Text>
            </View>
          </Reveal>
        ) : null}
        <View style={styles.revealProbeSibling} />
      </View>

      <Text style={styles.result}>
        spinner-layout-probe 的 outer 必须实测 96×64，并保留 translate + scale；
        caller 的 flex-start/flex-end 不能移动 inner。inner ring 必须保持 24×24
        居中并独立旋转，outer transform 与 inner rotate 必须同时生效。testID
        与完整 a11y 隐藏只在 outer。真实 native/Web 未核验前不得记 PASS。
      </Text>
      <Spinner
        size={24}
        thickness={3}
        style={styles.spinnerOuterProbe}
        testID="spinner-layout-probe"
      />
    </Section>
  );
}

/**
 * React useId、dirty prefix/override 与多实例 SVG definition 隔离。
 *
 * DOM/native Inspector 中每个 id 都必须满足 XML/SVG 名称约束，引用必须与 definition
 * 一致；真实两端检查前只能记 BLOCKED。
 */
function SvgIdSection(): React.JSX.Element {
  const dirtyPrefixA = useSvgId('9 dirty:prefix A');
  const dirtyPrefixB = useSvgId('9 dirty:prefix B');
  const emptyPartsFallback = useSvgId(':::', ':::');
  const controlledOverride = useSvgId('ignored prefix', 'custom:id value');
  const isSafeId = (value: string) => /^[A-Za-z_][A-Za-z0-9_.-]*$/u.test(value);

  return (
    <Section title="SVG ID sanitization / instance isolation">
      <Text style={styles.result}>
        Inspector 核对所有 gradient definition id 与 fill
        url(#id)：不得含空格、冒号或 非法开头。相同 dirty/空 override
        的不同实例必须回退各自 useId，不能碰撞； 两个 AvatarWithRing 自动 id
        也必须不同。dirty prefix、空 prefix + override、非空 dirty override
        都应稳定跨重渲染。真实 native/Web 节点未检查前不得记 PASS。
      </Text>
      <Result
        label="dirty prefix A"
        value={`${dirtyPrefixA}; safe=${String(isSafeId(dirtyPrefixA))}`}
      />
      <Result
        label="dirty prefix B"
        value={`${dirtyPrefixB}; safe=${String(isSafeId(dirtyPrefixB))}`}
      />
      <Result
        label="empty parts fallback"
        value={`${emptyPartsFallback}; safe=${String(
          isSafeId(emptyPartsFallback)
        )}`}
      />
      <Result
        label="controlled override"
        value={`${controlledOverride}; expected=custom-id-value`}
      />
      <View style={styles.svgIdProbeRow}>
        <View style={styles.decorationProbe} testID="svg-id-gradient-dirty-a">
          <GradientWash
            height={56}
            color="#EB6E00"
            fromOpacity={0.5}
            toOpacity={0}
            gradientId="9 wash:id A"
          />
        </View>
        <View style={styles.decorationProbe} testID="svg-id-gradient-dirty-b">
          <GradientWash
            height={56}
            color="#EB6E00"
            fromOpacity={0.5}
            toOpacity={0}
            gradientId="9 wash:id B"
          />
        </View>
        <View testID="svg-id-halo-empty-a">
          <RadialHalo size={56} color="#EB6E00" gradientId=":::" />
        </View>
        <View testID="svg-id-halo-empty-b">
          <RadialHalo size={56} color="#EB6E00" gradientId=":::" />
        </View>
        <AvatarWithRing label="甲" size={56} testID="svg-id-avatar-ring-a" />
        <AvatarWithRing label="乙" size={56} testID="svg-id-avatar-ring-b" />
      </View>
    </Section>
  );
}

/**
 * Logo / Grid / DrawerHeader / VersionPill 展示语义。
 *
 * 这里只提供真实节点与 action 计数；每个焦点、名称和隐藏子树必须在 native/Web
 * harness 逐项人工核验。
 */
function DisplaySemanticsSection(): React.JSX.Element {
  const [gridPresses, setGridPresses] = useState(0);
  const gridItems = [
    { id: 'messages', icon: 'mail', label: '消息', badge: 0 },
  ] as const;

  return (
    <Section title="Logo / Grid / DrawerHeader / VersionPill display a11y">
      <Text style={styles.result}>
        用 Inspector / screen reader 核对：logo-decorative 完整隐藏； logo-named
        是 role=image、名称“Unif”；logo-blank-a / logo-blank-b 同样隐藏，两个
        实例各自在首个 effect 输出一次 dev 诊断。点击 grid-action 会重渲染本
        section，两个 blank Logo 均不得重复诊断。grid-display 是无 button role
        的展示节点，grid-action 是 button，两者名称均为“消息，0”，badge
        视觉子树不产生第二焦点。drawer-header-image 与 drawer-header-fallback
        分别稳定提供 source Image / fallback initial
        分支；两者整个头像容器都隐藏，名称/副标题仍自然可读。version-pill-default
        名称为“版本 1.0.0，正常”，version-pill-custom 名称为“版本 2.0.0，build
        12，测试中”，version-pill-blank-status 必须显示/朗读“状态未知”并在
        effect 诊断。grid-blank-action 不得形成 button 或触发计数，且不能创建
        unnamed merged node。
      </Text>
      <View style={styles.row}>
        <Logo
          source={DISPLAY_IMAGE_SOURCE}
          testID="logo-decorative"
          size={40}
        />
        <Logo
          source={DISPLAY_IMAGE_SOURCE}
          accessibilityLabel="Unif"
          testID="logo-named"
          size={40}
        />
        <Logo
          source={DISPLAY_IMAGE_SOURCE}
          accessibilityLabel="  "
          testID="logo-blank-a"
          size={40}
        />
        <Logo
          source={DISPLAY_IMAGE_SOURCE}
          accessibilityLabel={'\t'}
          testID="logo-blank-b"
          size={40}
        />
      </View>
      <Grid items={[...gridItems]} columns={1} testID="grid-display" />
      <Grid
        items={[...gridItems]}
        columns={1}
        onPress={() => setGridPresses((count) => count + 1)}
        testID="grid-action"
      />
      <Result label="Grid action presses" value={String(gridPresses)} />
      <DrawerHeader
        name="张三"
        subtitle="华东团队"
        source={DISPLAY_IMAGE_SOURCE}
        testID="drawer-header-image"
      />
      <DrawerHeader
        name="李四"
        subtitle="华南团队"
        testID="drawer-header-fallback"
      />
      <View style={styles.row}>
        <VersionPill version="1.0.0" testID="version-pill-default" />
        <VersionPill
          version="2.0.0"
          build="12"
          status={{ label: '测试中' }}
          testID="version-pill-custom"
        />
        <VersionPill
          version="3.0.0"
          status={{ label: '   ' }}
          testID="version-pill-blank-status"
        />
      </View>
      <Grid
        items={[{ id: 'blank', icon: 'mail', label: '   ' }]}
        columns={1}
        onPress={() => setGridPresses((count) => count + 1)}
        testID="grid-blank-action"
      />
    </Section>
  );
}

type CarouselItem = { id: string; label: string };

const CAROUSEL_ITEMS: CarouselItem[] = [
  { id: 'display', label: '展示 slide' },
  { id: 'action', label: '可操作 slide' },
];

/**
 * Carousel:展示 / action 判别联合、单页布局与系统 reduced motion。
 *
 * 本区只提供可观察的 action 计数与系统偏好；slide 的真实 View/Pressable 分支、
 * Pagination 是否不存在及其 a11y tree 必须在 native/Web harness 人工核验。
 */
function CarouselSection(): React.JSX.Element {
  const [actionPresses, setActionPresses] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const oneItem = CAROUSEL_ITEMS.slice(0, 1);
  const invalidActionProps = {
    onPressItem: true,
    getAccessibilityLabel: { invalid: true },
  } as unknown as {
    onPressItem: (item: CarouselItem, index: number) => void;
    getAccessibilityLabel: (item: CarouselItem, index: number) => string;
  };

  return (
    <Section title="Carousel display / action / reduced motion">
      <Text style={styles.result}>
        用 Inspector / screen reader 核对：carousel-display 的每张 slide 是普通
        View、没有 button 焦点；carousel-action 的 slide 是 button，
        名称应为“可操作 slide，第 2 项，共 2 项”，点击只递增 action
        计数。carousel-blank-item-name 的空白 item 与
        carousel-invalid-action-config 全部必须是 display-only，并在 effect
        诊断。carousel-single 必须没有 Pagination 节点且容器高度就是 100；
        系统开启 reduced motion 后 carousel-reduced 虽传 autoplay 也必须静止。
        Pagination 存在时外层本地 View 必须完整隐藏其 a11y 子树。
      </Text>
      <Carousel
        data={CAROUSEL_ITEMS}
        height={100}
        renderItem={({ item }) => <CarouselSlide label={item.label} />}
        testID="carousel-display"
      />
      <Carousel
        data={CAROUSEL_ITEMS}
        height={100}
        renderItem={({ item }) => <CarouselSlide label={item.label} />}
        onPressItem={() => setActionPresses((count) => count + 1)}
        getAccessibilityLabel={(item) => item.label}
        testID="carousel-action"
      />
      <Carousel
        data={CAROUSEL_ITEMS}
        height={100}
        renderItem={({ item }) => <CarouselSlide label={item.label} />}
        onPressItem={() => setActionPresses((count) => count + 1)}
        getAccessibilityLabel={(item) =>
          item.id === 'display' ? '   ' : item.label
        }
        testID="carousel-blank-item-name"
      />
      <Carousel
        data={CAROUSEL_ITEMS}
        height={100}
        renderItem={({ item }) => <CarouselSlide label={item.label} />}
        {...invalidActionProps}
        testID="carousel-invalid-action-config"
      />
      <Carousel
        data={oneItem}
        height={100}
        renderItem={({ item }) => <CarouselSlide label={item.label} />}
        testID="carousel-single"
      />
      <Carousel
        data={CAROUSEL_ITEMS}
        height={100}
        autoplay
        renderItem={({ item }) => <CarouselSlide label={item.label} />}
        testID="carousel-reduced"
      />
      <Result label="Carousel action presses" value={String(actionPresses)} />
      <Result label="Carousel reduced motion" value={String(reducedMotion)} />
    </Section>
  );
}

function CarouselSlide({ label }: { label: string }): React.JSX.Element {
  return (
    <View style={styles.carouselSlide}>
      <Text style={styles.result}>{label}</Text>
    </View>
  );
}

/**
 * Cell:action/control/static 三分支、primitive 文本和 a11y 所有权。
 *
 * 本区只提供可观察结果与 testID；结构和读屏结论必须在 native/Web harness
 * 逐项人工核验后再写 verification matrix。
 */
function CellSection(): React.JSX.Element {
  const [actionPresses, setActionPresses] = useState(0);
  const [unexpectedPresses, setUnexpectedPresses] = useState(0);
  const [notify, setNotify] = useState(false);

  return (
    <Section title="Cell action / control / static">
      <Text style={styles.result}>
        用 Inspector / screen reader 核对：cell-action-text 外层是
        button，默认名称为 “订单，待支付，0”，IconName leading 与 chevron
        都不形成第二焦点；cell-action-display 名称为“设备，在线”，其自定义
        leading 与 display extra 同样隐藏；cell-control 与 cell-static
        外层均为本地 View、无 action/role，只有 cell-control-switch 自己承担
        switch 名称与 checked state。cell-static 的 title/desc/text extra
        应作为可见 Text 自然朗读；cell-static-display 的 display extra
        始终是装饰内容，不形成外层合并名称或独立焦点。禁用 action 应保留
        disabled button state，但 onPress 必须不存在且计数始终为 0。
        cell-action-blank-name 必须回退为本地 View，无 button/handler/arrow，
        并在 effect 诊断。
      </Text>
      <List>
        <Cell
          leading="settings"
          title="订单"
          desc="待支付"
          extra={{ kind: 'text', value: 0 }}
          arrow
          onPress={() => setActionPresses((count) => count + 1)}
          testID="cell-action-text"
        />
        <Cell
          leading={{
            kind: 'display',
            node: <Text style={styles.result}>设</Text>,
          }}
          title="设备"
          extra={{
            kind: 'display',
            node: <Text style={styles.result}>在线</Text>,
            accessibilityText: '在线',
          }}
          onPress={() => setActionPresses((count) => count + 1)}
          testID="cell-action-display"
        />
        <Cell
          title="通知"
          extra={{
            kind: 'control',
            node: (
              <Switch
                value={notify}
                onChange={setNotify}
                accessibilityLabel="通知"
                testID="cell-control-switch"
              />
            ),
          }}
          testID="cell-control"
        />
        <Cell
          title={0}
          desc={12n}
          extra={{ kind: 'text', value: 0 }}
          testID="cell-static"
        />
        <Cell
          title="静态品牌"
          extra={{
            kind: 'display',
            node: <Text style={styles.result}>装饰徽章</Text>,
          }}
          testID="cell-static-display"
        />
        <Cell
          title="禁用 action"
          desc="handler 必须移除"
          arrow
          disabled
          onPress={() => setUnexpectedPresses((count) => count + 1)}
          testID="cell-action-disabled"
        />
        <Cell
          title="   "
          accessibilityLabel={'\t'}
          arrow
          onPress={() => setUnexpectedPresses((count) => count + 1)}
          testID="cell-action-blank-name"
        />
      </List>
      <Result label="Cell action presses" value={String(actionPresses)} />
      <Result label="Cell control" value={String(notify)} />
      <Result
        label="Cell disabled action presses"
        value={String(unexpectedPresses)}
      />
    </Section>
  );
}

/**
 * 选择控件:accessible name、checked/disabled state、真实 frame 与 reduced motion。
 *
 * Inspector 在 native/Web 两端量 `selection-switch`:outer 固定为 44×44。其本地
 * 显示后代 `selection-switch-visual` 实现为 r(32)×r(20):Web 和 402pt RN harness
 * 是 32×20,其他 native window 按实际 r(32)×r(20) 验证。系统开启减弱动效后切换
 * Switch:两端都必须直接到终值；Web 展开 visual wrapper 后，track/thumb 两个精确
 * 节点都必须完全没有 transition* inline style。
 */
function SelectionControlsSection(): React.JSX.Element {
  const [checked, setChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('daily');
  const [switchValue, setSwitchValue] = useState(false);
  const [unexpectedPresses, setUnexpectedPresses] = useState(0);
  const [blankRadioUnexpected, setBlankRadioUnexpected] = useState(0);
  const [blankGroupValidActions, setBlankGroupValidActions] = useState(0);
  const reduced = usePrefersReducedMotion();

  return (
    <Section title="Checkbox / Radio / Switch a11y">
      <Text style={styles.result}>
        用 Inspector / screen reader 确认每个操作只有一个命名节点并上报
        checked/disabled。selection-switch 外层在所有平台应为 44×44；后代
        selection-switch-visual 实现为 r(32)×r(20)，Web / 402pt RN harness 应为
        32×20，其他 native 宽度按实际 r() 结果验证。系统开启 reduced motion
        后切换应立即到终值。Web 检查 selection-switch-track /
        selection-switch-thumb：两者都不得出现任何 transition* style。blank
        Checkbox/Switch 不得增加 disabled selection actions；blank Radio
        不得形成 unnamed action，blank Radio unexpected 必须保持 0。空白
        Radio.Group 只诊断组名，点击内部有名称的 Radio 必须增加 blank Group
        valid actions。
      </Text>
      <Checkbox checked={checked} onChange={setChecked} label="接收纸质账单" />
      <Checkbox
        checked={checked}
        onChange={setChecked}
        accessibilityLabel="仅图形 Checkbox"
        shape="circle"
      />
      <Checkbox
        checked
        onChange={() => setUnexpectedPresses((count) => count + 1)}
        label="禁用 Checkbox（不应触发）"
        disabled
      />
      <Checkbox
        checked={checked}
        onChange={() => setUnexpectedPresses((count) => count + 1)}
        label="   "
        accessibilityLabel={'\t'}
        testID="selection-checkbox-blank"
      />
      <Radio.Group
        value={radioValue}
        onChange={(nextValue) => {
          if (nextValue === 'disabled') {
            setUnexpectedPresses((count) => count + 1);
          } else if (nextValue === 'blank') {
            setBlankRadioUnexpected((count) => count + 1);
          } else {
            setRadioValue(String(nextValue));
          }
        }}
        accessibilityLabel="报告周期"
        testID="selection-radio-group"
      >
        <Radio value="daily" label="日报" />
        <Radio value="weekly" accessibilityLabel="周报（无可见 label）" />
        <Radio value="disabled" label="禁用选项（不应触发）" disabled />
        <Radio
          value="blank"
          label="   "
          accessibilityLabel={'\t'}
          testID="selection-radio-item-blank"
        />
      </Radio.Group>
      <Radio.Group
        value="named"
        onChange={() => setBlankGroupValidActions((count) => count + 1)}
        accessibilityLabel="   "
        testID="selection-radio-group-name-blank"
      >
        <Radio
          value="named"
          label="组名空白但 item 有名称"
          testID="selection-radio-group-name-blank-item"
        />
      </Radio.Group>
      <View style={styles.selectionRow}>
        <Switch
          value={switchValue}
          onChange={setSwitchValue}
          accessibilityLabel="拜访提醒"
          testID="selection-switch"
        />
        <Switch
          value
          onChange={() => setUnexpectedPresses((count) => count + 1)}
          accessibilityLabel="禁用提醒（不应触发）"
          disabled
          testID="selection-switch-disabled"
        />
        <Switch
          value={switchValue}
          onChange={() => setUnexpectedPresses((count) => count + 1)}
          accessibilityLabel="   "
          testID="selection-switch-blank"
        />
      </View>
      <Result label="selection checked" value={String(checked)} />
      <Result label="selection radio" value={radioValue} />
      <Result label="selection switch" value={String(switchValue)} />
      <Result label="selection reduced motion" value={String(reduced)} />
      <Result
        label="disabled selection actions"
        value={String(unexpectedPresses)}
      />
      <Result
        label="blank Radio unexpected"
        value={String(blankRadioUnexpected)}
      />
      <Result
        label="blank Group valid actions"
        value={String(blankGroupValidActions)}
      />
    </Section>
  );
}

/**
 * Stepper:md/sm 三个真实至少 44pt outer frame；xs 是 24×44 / 40×44 /
 * 24×44 且无 hitSlop 的 dense 例外；归一化零范围与边界 action。
 *
 * Inspector 应验证 side outer = max(44, visual button width) × max(44, visual height)，
 * value outer = max(44, visual value width) × max(44, visual height)。sm visual 是
 * r(28)×r(28) / r(40)×r(28) / r(28)×r(28)；只有 Web / 402pt RN harness 得到
 * 28/32/40/48 基准值。宽屏 native outer 必须包住完整 scaled visual。
 */
function StepperSection(): React.JSX.Element {
  const [middleValue, setMiddleValue] = useState(1);
  const [compactValue, setCompactValue] = useState(4);
  const [minActions, setMinActions] = useState(0);
  const [maxActions, setMaxActions] = useState(0);
  const [unexpectedActions, setUnexpectedActions] = useState(0);

  return (
    <Section title="Stepper frames / format / boundary actions">
      <Text style={styles.result}>
        用 Inspector 测量：stepper-middle-decrement/value/increment 的三个 outer
        均至少 44pt：side outer = max(44, visual button width) × max(44, visual
        height)，value outer = max(44, visual value width) × max(44, visual
        height)。md visual 是 r(32)×r(32) / r(48)×r(32) / r(32)×r(32)，仅 Web 与
        402pt RN harness 对应 32×32 / 48×32 / 32×32。stepper-compact 是明确的
        dense 例外，三个相邻且不重叠的 outer 必须为 24×44 / 40×44 / 24×44，
        不得出现 hitSlop，中央可见文案为“4 箱”但 slider now 仍是数字 4。
        stepper-zero-range 使用 sm；visual 是 r(28)×r(28) / r(40)×r(28) /
        r(28)×r(28)。
      </Text>
      <Text style={styles.result}>
        Web Inspector 检查中央 role=slider、aria-valuemin/max/now、disabled 与
        tab order；键盘逐一验证 ArrowUp/Right、ArrowDown/Left、Home、End。iOS
        分别检查过滤后的 custom actions 与标准 adjustable 手势：边界无效标准方向
        即使派发，也必须让业务值和 unexpected 计数保持不变。min/max
        无效侧按钮没有 handler。原始 min=10/max=0 折叠为
        now=min=max=10，中央上报 disabled 且完全没有
        handler，左右名称均保留“异常范围数量”上下文。不能根据源码或 Website
        build 标记 PASS。stepper-blank-name 的三个节点不得保留 action/role 或
        handler，并在 effect 诊断。
      </Text>
      <Row label="范围中间（md）">
        <Stepper
          value={middleValue}
          onChange={setMiddleValue}
          min={0}
          max={2}
          accessibilityLabel="商品数量"
          testID="stepper-middle"
        />
      </Row>
      <Row label="到 min（只允许增加）">
        <Stepper
          value={0}
          onChange={(nextValue) => {
            if (nextValue === 1) {
              setMinActions((count) => count + 1);
            } else {
              setUnexpectedActions((count) => count + 1);
            }
          }}
          min={0}
          max={2}
          accessibilityLabel="最低库存数量"
          testID="stepper-min"
        />
      </Row>
      <Row label="紧凑格式化（xs）">
        <Stepper
          value={compactValue}
          onChange={setCompactValue}
          min={0}
          max={99}
          size="xs"
          formatValue={(value) => `${value} 箱`}
          accessibilityLabel="紧凑整箱数量"
          testID="stepper-compact"
        />
      </Row>
      <Row label="到 max（只允许减少）">
        <Stepper
          value={2}
          onChange={(nextValue) => {
            if (nextValue === 1) {
              setMaxActions((count) => count + 1);
            } else {
              setUnexpectedActions((count) => count + 1);
            }
          }}
          min={0}
          max={2}
          accessibilityLabel="最高库存数量"
          testID="stepper-max"
        />
      </Row>
      <Row label="min > max（sm / 零范围）">
        <Stepper
          value={5}
          onChange={() => setUnexpectedActions((count) => count + 1)}
          min={10}
          max={0}
          size="sm"
          accessibilityLabel="异常范围数量"
          testID="stepper-zero-range"
        />
      </Row>
      <Row label="空白名称（全部 action 失败关闭）">
        <Stepper
          value={1}
          onChange={() => setUnexpectedActions((count) => count + 1)}
          min={0}
          max={2}
          accessibilityLabel="   "
          testID="stepper-blank-name"
        />
      </Row>
      <Result label="Stepper middle value" value={String(middleValue)} />
      <Result label="Stepper compact value" value={String(compactValue)} />
      <Result label="Stepper min valid actions" value={String(minActions)} />
      <Result label="Stepper max valid actions" value={String(maxActions)} />
      <Result
        label="Stepper unexpected actions"
        value={String(unexpectedActions)}
      />
    </Section>
  );
}

/** 必须在 ThemeProvider 子树中读取 role token,不能依赖 provider 外的 fallback。 */
function PlaceholderPriorityCase(): React.JSX.Element {
  const colors = useColors();
  return (
    <Input
      defaultValue=""
      placeholder="caller placeholder 色优先"
      placeholderTextColor={colors.primary}
    />
  );
}

/**
 * Pulse:非法参数、反向脉冲、两端相等与 reduced motion。
 *
 * 人工验收要点 —— 非法 duration 必须回退成 700ms 的正常脉冲(并在 Metro 日志里
 * 看到一条 dev warn),`from === to` 与系统开启减弱动效时必须**完全静止**。
 */
function PulseSection(): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  return (
    <Section title="Pulse">
      <Result label="系统 reduced motion" value={String(reduced)} />
      <Row label="默认(0.6↔1, 700ms)">
        <Pulse>
          <PulseSwatch />
        </Pulse>
      </Row>
      <Row label="非法 duration=0(应回退 700ms + dev warn)">
        <Pulse duration={0}>
          <PulseSwatch />
        </Pulse>
      </Row>
      <Row label="非法 delay=-1(应回退 0 + dev warn)">
        <Pulse delay={-1}>
          <PulseSwatch />
        </Pulse>
      </Row>
      <Row label="反向 from=0.9 → to=0.2(合法,原样保留)">
        <Pulse from={0.9} to={0.2}>
          <PulseSwatch />
        </Pulse>
      </Row>
      <Row label="两端相等 from=to=0.4(应完全静止)">
        <Pulse from={0.4} to={0.4}>
          <PulseSwatch />
        </Pulse>
      </Row>
      <Row label="PulseDot(默认 from=0.5)">
        <PulseDot size={12} />
      </Row>
      <Row label="Skeleton(默认 from=0.5)">
        <Skeleton shape="line" width={120} />
      </Row>
    </Section>
  );
}

function PulseSwatch(): React.JSX.Element {
  return <View style={styles.swatch} />;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={styles.result}>{label}</Text>
      {children}
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Result({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <Text style={styles.result} testID={`result-${label}`}>
      {label}: {value}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  safeArea: { flex: 1, minHeight: 0 },
  missingThemeModal: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  missingThemeProbe: {
    gap: 12,
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
  },
  content: { padding: 16, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  result: { fontSize: 14, flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  revealControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  fontScaleSample: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  fontScaleRuler: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  imageAttemptControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  thumbnailOuterProbe: {
    width: 196,
    height: 112,
    transform: [{ translateX: 4 }, { scale: 0.95 }],
  },
  thumbnailRuntimeImageProbe: {
    opacity: 0.45,
    position: 'absolute',
    top: 12,
    width: 999,
    height: 999,
  },
  revealProbeRow: {
    width: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  revealLayoutProbe: {
    flex: 1,
    opacity: 0.35,
  },
  revealProbeContent: {
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealProbeSibling: {
    width: 44,
    height: 44,
    borderWidth: 1,
  },
  spinnerOuterProbe: {
    width: 96,
    height: 64,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    transform: [{ translateX: 4 }, { scale: 1.2 }],
    borderWidth: 1,
  },
  svgIdProbeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  decorationProbe: {
    width: 96,
    height: 56,
    borderWidth: 1,
  },
  selectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navBarFrame: { borderWidth: 1 },
  carouselSlide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F97316',
  },
});
