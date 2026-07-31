import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  ConfirmHost,
  Input,
  PasswordInput,
  Pulse,
  PulseDot,
  Search,
  Skeleton,
  Textarea,
  ThemeProvider,
  ToastHost,
  confirm,
  toast,
  useColors,
  usePrefersReducedMotion,
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
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F97316',
  },
});
