import { useLayoutEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { PointerEvent } from 'react-native';
import { normalizeStepper } from './normalizeStepper';
import type { NormalizedStepper } from './normalizeStepper';

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
  onEditingChange?: (editing: boolean) => void
) {
  const [draft, setDraft] = useState<string | null>(null);
  const active = useRef<{ text: string } | null>(null);
  const pressingStep = useRef(false);
  const editingChange = useRef(onEditingChange);
  useLayoutEffect(() => {
    editingChange.current = onEditingChange;
  });
  const { safeMin, safeMax, safeStep, safeValue } = normalized;
  useLayoutEffect(() => {
    active.current = null;
    pressingStep.current = false;
    setDraft(null);
    return () => {
      if (active.current) {
        active.current = null;
        editingChange.current?.(false);
      }
    };
  }, [enabled, value, safeMin, safeMax, safeStep]);

  const session = active.current;
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
    const wasEditing = active.current !== null;
    active.current = null;
    setDraft(null);
    onChange(next);
    if (wasEditing) editingChange.current?.(false);
  };
  const submit = () => {
    if (!session || active.current !== session) return;
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
      active.current = { text };
      setDraft(text);
      editingChange.current?.(true);
    },
    change,
    inputProps: {
      onChangeText: (text: string) => {
        if (!session || active.current !== session) return;
        session.text = text;
        setDraft(text);
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
