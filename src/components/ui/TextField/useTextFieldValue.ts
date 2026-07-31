import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '../../../utils/logger';
import {
  applyTextChange,
  createValueState,
  reconcileValueState,
  resolveCanUpdate,
} from './valueState';
import type {
  TextFieldValueController,
  ValueDiagnostic,
  ValueState,
} from './valueState';

const log = createLogger('TextField');

const DIAGNOSTIC_MESSAGE: Record<ValueDiagnostic, string> = {
  'controlled-to-uncontrolled':
    '受控输入的 value 变成了 undefined。mode 已在首次 render 锁定为受控,本次沿用上一个合法值 —— 请始终传字符串(清空用 "")。',
  'uncontrolled-to-controlled':
    '非受控输入后来收到了 value。mode 已在首次 render 锁定为非受控,该 value 被忽略 —— 请从一开始就同时传 value 与 onChangeText。',
};

export type UseTextFieldValueInput = {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChangeText?: ((value: string) => void) | undefined;
};

/**
 * 把纯值状态机接到 React 上。
 *
 * state 放在 ref 而不是 useState:mode 与受控值必须在**本次 render 内**就正确,
 * 不能等下一次提交 —— 否则受控组件会先渲染一帧旧值。非受控写入用一个递增 tick
 * 触发重渲染,值本身仍以 ref 为准。
 *
 * 诊断只在 effect 里打:render 期打日志在 StrictMode 双调用下会重复,
 * 且违反 render 必须纯净的约束。
 */
export function useTextFieldValue(
  { value, defaultValue, onChangeText }: UseTextFieldValueInput,
  scope: string
): TextFieldValueController {
  const stateRef = useRef<ValueState | null>(null);
  if (stateRef.current === null) {
    stateRef.current = createValueState(value, defaultValue);
  }
  const [, bumpTick] = useState(0);

  const transition = reconcileValueState(stateRef.current, value);
  stateRef.current = transition.state;
  const mode = transition.state.mode;
  const canUpdate = resolveCanUpdate(mode, onChangeText);

  const diagnostic = transition.diagnostic;
  useEffect(() => {
    if (diagnostic) log.warn(`${scope}: ${DIAGNOSTIC_MESSAGE[diagnostic]}`);
  }, [diagnostic, scope]);

  useEffect(() => {
    if (!canUpdate) {
      log.warn(
        `${scope}: 受控输入缺少 onChangeText,输入将无法生效。请补上回调,或改用非受控(不传 value)。`
      );
    }
  }, [canUpdate, scope]);

  const handleChangeText = useCallback(
    (next: string) => {
      const current = stateRef.current;
      if (!current) return;
      if (current.mode === 'uncontrolled') {
        stateRef.current = applyTextChange(current, next);
        bumpTick((tick) => tick + 1);
        onChangeText?.(next);
        return;
      }
      // 受控:内部永不写值,只把输入交给调用方。没有回调时直接 no-op ——
      // 若照旧透传给原生,UI 会显示一个 state 里并不存在的值。
      if (!canUpdate) return;
      onChangeText?.(next);
    },
    [canUpdate, onChangeText]
  );

  return {
    mode,
    value: transition.value,
    canUpdate,
    onChangeText: handleChangeText,
  };
}
