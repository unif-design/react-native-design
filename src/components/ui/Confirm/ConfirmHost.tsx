import React, { useCallback, useEffect, useState } from 'react';
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

  useEffect(() => {
    const sub: Subscriber = (next) => setEntry(next);
    _subs.add(sub);
    return () => {
      _subs.delete(sub);
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
        accessibilityRole="button"
        accessibilityLabel="关闭"
      >
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + space['7'] }]}
          onPress={() => {}}
        >
          {entry ? (
            <>
              <View style={styles.body}>
                <Text style={styles.title} accessibilityRole="header">
                  {entry.title}
                </Text>
                {entry.message ? (
                  <Text style={styles.message}>{entry.message}</Text>
                ) : null}
              </View>
              <View style={styles.actions}>
                <Button
                  testID="confirm-cancel"
                  label={entry.cancelLabel ?? '取消'}
                  variant="secondary"
                  block
                  onPress={handleCancel}
                />
                <Button
                  testID="confirm-ok"
                  label={entry.confirmLabel ?? '确认'}
                  variant={entry.destructive ? 'danger' : 'primary'}
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
