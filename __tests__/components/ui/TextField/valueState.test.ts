import { describe, expect, test } from '@jest/globals';
import {
  applyTextChange,
  createValueState,
  reconcileValueState,
  resolveCanUpdate,
} from '../../../../src/components/ui/TextField/valueState';

describe('createValueState — 首次 render 锁定 mode', () => {
  test('value 是字符串 → controlled', () => {
    expect(createValueState('A', undefined)).toEqual({
      mode: 'controlled',
      value: 'A',
      lastValidControlledValue: 'A',
    });
  });

  test('空字符串同样是 controlled(不是 falsy 判定)', () => {
    expect(createValueState('', undefined)).toEqual({
      mode: 'controlled',
      value: '',
      lastValidControlledValue: '',
    });
  });

  test('显式 undefined 视为 uncontrolled,从 defaultValue 起步', () => {
    expect(createValueState(undefined, 'seed')).toEqual({
      mode: 'uncontrolled',
      value: 'seed',
    });
  });

  test('两者都缺省时 uncontrolled 从空串起步', () => {
    expect(createValueState(undefined, undefined)).toEqual({
      mode: 'uncontrolled',
      value: '',
    });
  });

  test('controlled 时 defaultValue 完全不参与', () => {
    expect(createValueState('A', 'seed').value).toBe('A');
  });
});

describe('reconcileValueState — mode 永不切换', () => {
  test('controlled 丢失 value 时保留最后合法字符串且不切 mode', () => {
    const initial = createValueState('A', undefined);
    const lost = reconcileValueState(initial, undefined);
    expect(lost).toMatchObject({
      value: 'A',
      diagnostic: 'controlled-to-uncontrolled',
      state: { mode: 'controlled', lastValidControlledValue: 'A' },
    });
    const restored = reconcileValueState(lost.state, 'B');
    expect(restored.value).toBe('B');
  });

  test('恢复后不再报诊断,且 lastValid 前进', () => {
    const lost = reconcileValueState(
      createValueState('A', undefined),
      undefined
    );
    const restored = reconcileValueState(lost.state, 'B');
    expect(restored.diagnostic).toBeUndefined();
    expect(restored.state).toEqual({
      mode: 'controlled',
      value: 'B',
      lastValidControlledValue: 'B',
    });
  });

  test('controlled 接收空串是合法值,不算丢失', () => {
    const next = reconcileValueState(createValueState('A', undefined), '');
    expect(next.value).toBe('');
    expect(next.diagnostic).toBeUndefined();
  });

  test('uncontrolled 忽略后续 value/defaultValue,只接受用户输入', () => {
    const initial = createValueState(undefined, 'seed');
    const injected = reconcileValueState(initial, 'controlled later');
    expect(injected.value).toBe('seed');
    expect(injected.diagnostic).toBe('uncontrolled-to-controlled');
    expect(applyTextChange(injected.state, 'typed').value).toBe('typed');
  });

  test('uncontrolled 收到 undefined 不算诊断', () => {
    const initial = createValueState(undefined, 'seed');
    const next = reconcileValueState(initial, undefined);
    expect(next.diagnostic).toBeUndefined();
    expect(next.value).toBe('seed');
  });

  test('defaultValue 在 mount 后变化不影响已锁定的值', () => {
    // defaultValue 只在 createValueState 里读一次;reconcile 根本不接收它
    const initial = createValueState(undefined, 'seed');
    const typed = applyTextChange(initial, 'typed');
    expect(reconcileValueState(typed, undefined).value).toBe('typed');
  });

  test('transition 不原地修改传入的 state', () => {
    const initial = createValueState('A', undefined);
    reconcileValueState(initial, 'B');
    expect(initial.value).toBe('A');
  });
});

describe('applyTextChange — 只写 uncontrolled', () => {
  test('uncontrolled 写入新值', () => {
    const state = createValueState(undefined, 'seed');
    expect(applyTextChange(state, 'typed')).toEqual({
      mode: 'uncontrolled',
      value: 'typed',
    });
  });

  test('controlled 的内部值不被写入', () => {
    const state = createValueState('A', undefined);
    expect(applyTextChange(state, 'typed')).toEqual(state);
  });

  test('不原地修改传入的 state', () => {
    const state = createValueState(undefined, 'seed');
    applyTextChange(state, 'typed');
    expect(state.value).toBe('seed');
  });
});

describe('resolveCanUpdate — 缺更新入口时禁止写入', () => {
  test('uncontrolled 恒可更新(内部持值)', () => {
    expect(resolveCanUpdate('uncontrolled', undefined)).toBe(true);
    expect(resolveCanUpdate('uncontrolled', () => {})).toBe(true);
  });

  test('controlled 只有带回调才可更新', () => {
    expect(resolveCanUpdate('controlled', () => {})).toBe(true);
    expect(resolveCanUpdate('controlled', undefined)).toBe(false);
  });
});
