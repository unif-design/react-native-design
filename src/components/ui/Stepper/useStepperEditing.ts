import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { PointerEvent } from 'react-native';
import { normalizeStepper } from './normalizeStepper';
import type { NormalizedStepper } from './normalizeStepper';
import type { StepperEditingSession } from './types';

function parseDraft(text: string): number | undefined {
  const trimmed = text.trim();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed))
    return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

/** 仅持有未提交草稿；外部值与范围始终由 Stepper 的受控 props 决定。 */
export function useStepperEditing(
  value: number,
  enabled: boolean,
  normalized: NormalizedStepper,
  onChange: (value: number) => void,
  onEditingChange?: (editing: boolean) => void,
  controlledDraft?: string | null,
  onDraftChange?: (draft: string | null) => void
) {
  const [localDraft, setLocalDraft] = useState<string | null>(null);
  const suppliedDraft =
    controlledDraft === undefined ? localDraft : controlledDraft;
  const [restart, setRestart] = useState(0);
  const controlledSession = useMemo<StepperEditingSession | null>(
    () => (controlledDraft == null ? null : { text: controlledDraft, restart }),
    [controlledDraft, restart]
  );
  const [cancelledSession, setCancelledSession] =
    useState<typeof controlledSession>(null);
  const cancelled =
    controlledSession !== null && controlledSession === cancelledSession;
  const draft = enabled && !cancelled ? suppliedDraft : null;
  const initialSession = useRef(enabled ? controlledSession : null);
  const active = useRef(initialSession.current);
  const submitted = useRef<typeof controlledSession>(null);
  const pressingStep = useRef(false);
  const editingChange = useRef(onEditingChange);
  const draftChange = useRef(onDraftChange);
  useLayoutEffect(() => {
    editingChange.current = onEditingChange;
    draftChange.current = onDraftChange;
  });
  const { safeMin, safeMax, safeStep, safeValue } = normalized;
  const settings = useRef([value, safeMin, safeMax, safeStep]);
  const previousEnabled = useRef(enabled);
  const previousDraft = useRef(controlledDraft);
  useLayoutEffect(() => {
    // StrictMode 重放只恢复本次实例的 UI 会话，不清空调用方持有的草稿。
    active.current = initialSession.current;
    if (active.current) editingChange.current?.(true);
    return () => {
      if (active.current) {
        active.current = null;
        editingChange.current?.(false);
      }
    };
  }, []);
  useLayoutEffect(() => {
    const next = [value, safeMin, safeMax, safeStep];
    const settingsChanged = next.some(
      (item, index) => !Object.is(item, settings.current[index])
    );
    settings.current = next;
    const enabledChanged = previousEnabled.current !== enabled;
    previousEnabled.current = enabled;
    const draftChanged = previousDraft.current !== controlledDraft;
    previousDraft.current = controlledDraft;
    if (settingsChanged || (!enabled && active.current !== null)) {
      const wasEditing = active.current !== null;
      active.current = null;
      pressingStep.current = false;
      setLocalDraft(null);
      setCancelledSession(controlledSession);
      const needsClear =
        controlledDraft === undefined ? wasEditing : controlledDraft !== null;
      if (
        needsClear &&
        !cancelled &&
        (controlledDraft === undefined ||
          submitted.current !== controlledSession)
      )
        draftChange.current?.(null);
      if (wasEditing) editingChange.current?.(false);
    } else if (
      draftChanged ||
      enabledChanged ||
      (enabled &&
        !cancelled &&
        controlledSession !== null &&
        active.current !== controlledSession)
    ) {
      const wasEditing = active.current !== null;
      active.current = enabled && !cancelled ? controlledSession : null;
      pressingStep.current = false;
      if (controlledDraft === undefined) setLocalDraft(null);
      const editing = active.current !== null;
      if (wasEditing !== editing) editingChange.current?.(editing);
    }
  }, [
    enabled,
    value,
    safeMin,
    safeMax,
    safeStep,
    controlledDraft,
    controlledSession,
    cancelled,
  ]);

  const session =
    draft === null
      ? null
      : controlledDraft === undefined
        ? active.current
        : controlledSession;
  const updateDraft = (next: string | null) => {
    if (next === draft) return;
    if (controlledDraft === undefined) setLocalDraft(next);
    draftChange.current?.(next);
  };
  const parsed = draft === null ? undefined : parseDraft(draft);
  const invalid = draft !== null && parsed === undefined;
  const draftNormalized = normalizeStepper({
    value: parsed,
    min: safeMin,
    max: safeMax,
    step: safeStep,
    disabled: invalid,
  });
  const change = (next: number) => {
    if (session && active.current !== session) return;
    const wasEditing = active.current !== null;
    // 受控宿主可拒绝结束编辑；同一原稿只提交一次，继续输入会建立新会话。
    if (controlledDraft === undefined) active.current = null;
    else submitted.current = active.current;
    onChange(next);
    updateDraft(null);
    if (wasEditing && controlledDraft === undefined)
      editingChange.current?.(false);
  };
  const submit = () => {
    if (!session || active.current !== session || submitted.current === session)
      return;
    const next = parseDraft(session.text);
    if (next === undefined) return;
    change(
      normalizeStepper({ value: next, min: safeMin, max: safeMax }).safeValue
    );
  };

  return {
    editing: draft !== null,
    draft,
    invalid,
    normalized: draft === null ? normalized : draftNormalized,
    begin: () => {
      if (!enabled || active.current) return;
      const text = String(safeValue);
      if (controlledDraft === undefined) {
        active.current = { text };
        editingChange.current?.(true);
      } else if (cancelled && text === controlledDraft) {
        // 原文未变也必须换会话身份，不能重新接纳取消前的事件。
        setRestart((current) => current + 1);
      }
      updateDraft(text);
    },
    change,
    inputProps: {
      onChangeText: (text: string) => {
        if (!session || active.current !== session) return;
        if (controlledDraft === undefined) session.text = text;
        updateDraft(text);
      },
      onSubmitEditing: submit,
      onBlur: () => {
        // Pressable 的 pressIn 先于输入失焦；最终数值由同次 onPress 交付。
        if (!pressingStep.current) submit();
      },
    },
    stepPressProps: {
      onPressIn: () => {
        pressingStep.current = true;
      },
      onPressOut: () => {
        pressingStep.current = false;
      },
      onPointerDown: (event: PointerEvent) => {
        if (Platform.OS === 'web' && active.current) event.preventDefault();
      },
    },
  };
}
