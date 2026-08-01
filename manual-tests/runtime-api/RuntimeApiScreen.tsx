import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Cell,
  Checkbox,
  ConfirmHost,
  IconButton,
  Input,
  List,
  NavBar,
  PasswordInput,
  Pulse,
  PulseDot,
  Radio,
  Search,
  Skeleton,
  Switch,
  Textarea,
  ThemeProvider,
  ToastHost,
  confirm,
  toast,
  useColors,
  usePrefersReducedMotion,
  type NavBarSlot,
} from '@unif/react-native-design';

/**
 * Runtime API 人工验证屏 —— 由 `yarn create:runtime-harness` 拷进临时的
 * RN 0.86.2 app 里跑,**不属于任何自动化测试**。
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
  const [error, setError] = useState('');
  const [search, setSearch] = useState('查询');
  const [searchResult, setSearchResult] = useState('—');
  const [buttonPresses, setButtonPresses] = useState(0);
  const [unexpectedPresses, setUnexpectedPresses] = useState(0);
  const [navBarAction, setNavBarAction] = useState('—');
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
                <Result label="confirm 结果" value={confirmResult} />
                <Result label="重入 B 结果" value={reentryResult} />
              </Section>

              <Section title="Button / IconButton / NavBar action 与 a11y">
                <Text style={styles.result}>
                  用 Inspector 或 screen reader 确认 disabled / loading 均移除
                  handler 并上报 disabled；loading 额外上报 busy。点击 enabled
                  操作应递增，另两项必须保持 0。
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
                <IconButton
                  icon="check"
                  accessibilityLabel="enabled IconButton"
                  testID="action-icon-enabled"
                  onPress={() => setButtonPresses((count) => count + 1)}
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
                    title="无类型 malformed action 应为空"
                    left={malformedNavBarLeft}
                  />
                </View>
                <Result label="NavBar action" value={navBarAction} />
                <Text style={styles.result}>
                  malformed NavBar 在首次挂载后应只在 Metro 输出一次警告，left
                  slot 不显示。
                </Text>
              </Section>

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
                  iOS 错误播报。
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
                  label="切换错误（iOS 后续变化才播报）"
                  variant="secondary"
                  onPress={() =>
                    setError((current) => (current ? '' : '请输入有效内容'))
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

              <CellSection />

              <PulseSection />
            </ScrollView>
          </SafeAreaView>

          {/* ConfirmHost 全屏只挂一次 —— 多挂的实例会惰性,不会重复渲染。 */}
          <ConfirmHost />
          {toastHostOn ? (
            <ToastHost key={toastHostKey} testID="toast-host" />
          ) : null}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
        switch 名称与 checked state。禁用 action 应保留 disabled button
        state，但 onPress 必须不存在且计数始终为 0。
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
          title="禁用 action"
          desc="handler 必须移除"
          arrow
          disabled
          onPress={() => setUnexpectedPresses((count) => count + 1)}
          testID="cell-action-disabled"
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
  const reduced = usePrefersReducedMotion();

  return (
    <Section title="Checkbox / Radio / Switch a11y">
      <Text style={styles.result}>
        用 Inspector / screen reader 确认每个操作只有一个命名节点并上报
        checked/disabled。selection-switch 外层在所有平台应为 44×44；后代
        selection-switch-visual 实现为 r(32)×r(20)，Web / 402pt RN harness 应为
        32×20，其他 native 宽度按实际 r() 结果验证。系统开启 reduced motion
        后切换应立即到终值。Web 检查 selection-switch-track /
        selection-switch-thumb：两者都不得出现任何 transition* style。
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
      <Radio.Group
        value={radioValue}
        onChange={(nextValue) => {
          if (nextValue === 'disabled') {
            setUnexpectedPresses((count) => count + 1);
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
      </View>
      <Result label="selection checked" value={String(checked)} />
      <Result label="selection radio" value={radioValue} />
      <Result label="selection switch" value={String(switchValue)} />
      <Result label="selection reduced motion" value={String(reduced)} />
      <Result
        label="disabled selection actions"
        value={String(unexpectedPresses)}
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
  root: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 16, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  result: { fontSize: 14, flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navBarFrame: { borderWidth: 1 },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F97316',
  },
});
