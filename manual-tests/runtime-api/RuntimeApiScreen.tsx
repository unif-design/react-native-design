import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Button,
  ConfirmHost,
  ThemeProvider,
  confirm,
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
      <ThemeProvider>
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
        </ScrollView>

        {/* ConfirmHost 全屏只挂一次 —— 多挂的实例会惰性,不会重复渲染。 */}
        <ConfirmHost />
      </ThemeProvider>
    </GestureHandlerRootView>
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
  content: { padding: 16, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  result: { fontSize: 14 },
});
