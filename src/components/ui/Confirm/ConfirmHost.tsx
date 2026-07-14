import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, useThemedStyles } from '../../../theme';
import { Button } from '../Button';
import { _subs } from './confirm';
import { makeStyles } from './styles';
import type { ConfirmEntry, Subscriber } from './types';

/** 遮罩淡入 / 淡出时长(ms)—— 出场略长于入场,与 Modal slide 退场(~300ms)大致同步收完。 */
const SCRIM_IN_MS = 220;
const SCRIM_OUT_MS = 260;

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
  const { height: screenH } = useWindowDimensions();
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
    // [L-101] Subscriber 不再接收 null —— 收到新 entry 即显示;关闭路径由 resolve() 驱动
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

  // 遮罩自持淡入 / 淡出(不蹭 Modal 的位移动画,理由见下方 scrim 注释)。退场也要淡:
  // entry 置 null 后 Modal 仍在滑出、本层仍挂载,不淡的话遮罩会在滑出末尾硬切消失。
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(scrimOpacity, {
      toValue: entry ? 1 : 0,
      duration: entry ? SCRIM_IN_MS : SCRIM_OUT_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [entry, scrimOpacity]);

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
        {/* 半透黑遮罩 —— 两点都是必需的,少一点就露白:
            ① **向上外扩一屏**:animationType="slide" 位移的是 Modal 的**整个容器**(遮罩也在其中),
               位移 t 时屏幕 [0, t) 这段根本没有遮罩 —— 顶部挂着一条未压暗的白带,一路缩到动画
               结束才没(缓出末段最慢,细白带在状态栏那儿赖得最久)。外扩后任意 t 都盖满视口。
            ② **自持淡入淡出**:外扩解决了「盖不到」,但遮罩会随容器一起硬切出现 —— 故不蹭容器的
               位移动画,自己走 opacity。sheet 的 slide 仍由 Modal 原生驱动。
            pointerEvents=none:点击穿透到 backdrop(取消路径不变)。 */}
        <Animated.View
          pointerEvents="none"
          style={[styles.scrim, { top: -screenH, opacity: scrimOpacity }]}
          testID="confirm-scrim"
        />
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
