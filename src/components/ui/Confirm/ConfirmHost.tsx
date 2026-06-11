import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, useThemedStyles } from '../../../theme';
import { Button } from '../Button';
import { _subs } from './confirm';
import { makeStyles } from './styles';
import type { ConfirmEntry, Subscriber } from './types';

/**
 * Confirm 对话框宿主 —— App 根挂一次,监听 `confirm()` 调用并渲染。
 *
 * 原生 RN `Modal`(transparent + animationType slide)从底部滑入,backdrop 点击
 * 取消、内层 sheet 拦截点击不冒泡。**不依赖 @gorhom**(0.6.0 去 @gorhom 后改为
 * 纯 RN Modal + pub/sub 实现)。
 */
export function ConfirmHost(): React.JSX.Element | null {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [entry, setEntry] = useState<ConfirmEntry | null>(null);

  // 跟踪当前未决 entry,供 unmount cleanup resolve(false)。
  const pendingRef = useRef<ConfirmEntry | null>(null);
  pendingRef.current = entry;

  // 保留最后一次显示的 entry:关闭时 entry 立即置 null,但 slide 退场动画期 Modal 仍可见,
  // 渲染 lastEntry 才不会滑出一个只剩 padding 的空 sheet([M-17])。
  const lastEntryRef = useRef<ConfirmEntry | null>(null);
  if (entry) lastEntryRef.current = entry;
  const display = entry ?? lastEntryRef.current;

  useEffect(() => {
    const sub: Subscriber = (next) => setEntry(next);
    _subs.add(sub);
    return () => {
      _subs.delete(sub);
      // Host 卸载时若对话框仍未决(error boundary 重置 / 根 re-key 切语言主题等),
      // resolve(false) —— 否则 confirm() 的 Promise 永久悬挂、_activeEntry 锁死([H-5])。
      pendingRef.current?.resolve(false);
    };
  }, []);

  const handleConfirm = useCallback(() => {
    entry?.resolve(true);
    setEntry(null);
  }, [entry]);

  const handleCancel = useCallback(() => {
    entry?.resolve(false);
    setEntry(null);
  }, [entry]);

  return (
    <Modal
      visible={!!entry}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      {/* backdrop 点击取消;内层 sheet onPress 空占位拦截冒泡 */}
      <Pressable
        style={styles.backdrop}
        onPress={handleCancel}
        // [M-16] accessible={false}:否则 backdrop 把整个子树合并成单一「关闭, 按钮」,
        // 遮蔽 sheet 内的 title/message/按钮。SR 取消路径走 cancel 按钮 + onRequestClose。
        accessible={false}
      >
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + space['7'] }]}
          onPress={() => {}}
          accessible={false}
        >
          {display ? (
            <>
              <View style={styles.body}>
                <Text style={styles.title} accessibilityRole="header">
                  {display.title}
                </Text>
                {display.message ? (
                  <Text style={styles.message}>{display.message}</Text>
                ) : null}
              </View>
              <View style={styles.actions}>
                <Button
                  testID="confirm-cancel"
                  label={display.cancelLabel ?? '取消'}
                  variant="secondary"
                  block
                  onPress={handleCancel}
                />
                <Button
                  testID="confirm-ok"
                  label={display.confirmLabel ?? '确认'}
                  variant={display.destructive ? 'danger' : 'primary'}
                  block
                  onPress={handleConfirm}
                />
              </View>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
