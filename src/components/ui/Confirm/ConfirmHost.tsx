import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useThemedStyles } from '../../../theme';
import { Button } from '../Button';
import { _subs } from './confirm';
import { makeStyles } from './styles';
import type { ConfirmEntry, Subscriber } from './types';

/** Scrim backdrop —— 单色半透黑 opacity 0.5 */
function ScrimBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.5}
    />
  );
}

/**
 * Confirm 对话框 Portal —— App 根挂一次,监听 `confirm()` 调用并渲染。
 *
 * 走 `<BottomSheetModal>` + `<BottomSheetModalProvider>`,通过 Provider Portal
 * 自动渲染到 App 顶层 —— 整屏 backdrop + 不受 React tree 位置影响。
 */
export function ConfirmHost(): React.JSX.Element | null {
  const styles = useThemedStyles(makeStyles);
  const modalRef = useRef<BottomSheetModal>(null);
  const [entry, setEntry] = useState<ConfirmEntry | null>(null);

  useEffect(() => {
    const sub: Subscriber = (next) => {
      setEntry(next);
      if (next) {
        modalRef.current?.present();
      } else {
        modalRef.current?.dismiss();
      }
    };
    _subs.add(sub);
    return () => {
      _subs.delete(sub);
    };
  }, []);

  // onDismiss:drag-to-close / backdrop tap / 程序 dismiss 都触发,entry 还在视为取消
  // 三个 handler 都用 useCallback + [entry] deps —— 让 renderFooter 的 useCallback
  // deps 能正确锁定它们,引用稳定 = @gorhom 不会因 backdrop 重生成而抖动。
  const handleDismiss = useCallback(() => {
    if (entry) {
      entry.resolve(false);
      setEntry(null);
    }
  }, [entry]);

  const handleConfirm = useCallback(() => {
    entry?.resolve(true);
    modalRef.current?.dismiss();
  }, [entry]);

  const handleCancel = useCallback(() => {
    entry?.resolve(false);
    modalRef.current?.dismiss();
  }, [entry]);

  const snapPoints = useMemo(() => ['30%'], []);

  // 用 BottomSheetFooter 浮按钮:BottomSheetView 内部 absolute top/left/right 无 bottom,
  // flex marginTop:auto 推不动按钮,所以必须走 footer + bottomInset 自动避让键盘。
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) =>
      entry ? (
        <BottomSheetFooter {...props} bottomInset={0}>
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
        </BottomSheetFooter>
      ) : null,
    [entry, styles.actions, handleCancel, handleConfirm]
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      index={0}
      enableDynamicSizing={false}
      enableOverDrag={false}
      backdropComponent={ScrimBackdrop}
      backgroundStyle={styles.sheetBackground}
      footerComponent={renderFooter}
      onDismiss={handleDismiss}
    >
      <BottomSheetView style={styles.sheet}>
        {entry ? (
          <>
            <Text style={styles.title}>{entry.title}</Text>
            {entry.message ? (
              <Text style={styles.message}>{entry.message}</Text>
            ) : null}
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
