/**
 * TextField 家族的**纯值状态机** —— 无 React 依赖,可直接单测。
 *
 * 核心规则:**mode 在首次 render 锁定,之后永不切换**。
 *
 * 为什么 —— 受控 / 非受控中途互换是 React 里最难查的一类 bug:光标跳位、输入被回滚、
 * 表单提交拿到过期值。与其在每次 render 猜测调用方意图,不如锁定一次并在偏离时报诊断。
 *
 * mode 判据是 `value !== undefined`,**不是** `'value' in props` 也不是
 * `typeof value === 'string'`:前者会把 `<Input value={maybeUndefined} />` 这种
 * 常见写法误判为受控(值一旦为 undefined 就锁死输入),后者对显式 `undefined` 与
 * 缺省无法区分。显式 `undefined` 一律按非受控处理。
 */

export type ValueState =
  | {
      mode: 'controlled';
      value: string;
      /** controlled 下 value 短暂变成 undefined 时用来兜底的最后一个合法字符串。 */
      lastValidControlledValue: string;
    }
  | {
      mode: 'uncontrolled';
      value: string;
      lastValidControlledValue?: never;
    };

export type ValueDiagnostic =
  | 'controlled-to-uncontrolled'
  | 'uncontrolled-to-controlled'
  | 'invalid-controlled-value';

export type ValueTransition = {
  state: ValueState;
  value: string;
  diagnostic?: ValueDiagnostic;
};

export type TextFieldValueController = {
  mode: ValueState['mode'];
  value: string;
  /** 是否存在真正能落地的更新入口;false 时 onChangeText 是 no-op。 */
  canUpdate: boolean;
  onChangeText: (value: string) => void;
};

export function createValueState(
  value: unknown,
  defaultValue: unknown
): ValueState {
  if (value !== undefined) {
    const safeValue = typeof value === 'string' ? value : '';
    return {
      mode: 'controlled',
      value: safeValue,
      lastValidControlledValue: safeValue,
    };
  }
  return {
    mode: 'uncontrolled',
    value: typeof defaultValue === 'string' ? defaultValue : '',
  };
}

/**
 * 用本轮 render 的 `value` 与已锁定的 state 对账。返回新 state(不原地修改)、
 * 本轮应当显示的值,以及偏离锁定 mode 时的诊断。
 */
export function reconcileValueState(
  state: ValueState,
  incomingValue: unknown
): ValueTransition {
  if (state.mode === 'controlled') {
    if (incomingValue === undefined) {
      // 受控组件的 value 变成 undefined:保持受控,显示最后一个合法值。
      // 若直接透传 undefined 给 TextInput,RN 会把它当成非受控并保留用户输入 —— 静默换 mode。
      return {
        state,
        value: state.lastValidControlledValue,
        diagnostic: 'controlled-to-uncontrolled',
      };
    }
    if (typeof incomingValue !== 'string') {
      return {
        state,
        value: state.lastValidControlledValue,
        diagnostic: 'invalid-controlled-value',
      };
    }
    return {
      state: {
        mode: 'controlled',
        value: incomingValue,
        lastValidControlledValue: incomingValue,
      },
      value: incomingValue,
    };
  }
  if (incomingValue !== undefined) {
    // 非受控组件后来又传了 value:忽略它,继续用内部值,只报诊断。
    return {
      state,
      value: state.value,
      diagnostic: 'uncontrolled-to-controlled',
    };
  }
  return { state, value: state.value };
}

/** 用户输入。只有非受控才写内部值;受控的值永远来自调用方。 */
export function applyTextChange(state: ValueState, text: string): ValueState {
  if (state.mode === 'controlled') return state;
  return { mode: 'uncontrolled', value: text };
}

/**
 * 非受控恒可更新(内部持值);受控只有拿到 `onChangeText` 才可更新 ——
 * 类型层已要求受控必须带回调,这里兜住未走类型的 JS 调用方。
 */
export function resolveCanUpdate(
  mode: ValueState['mode'],
  onChangeText: ((value: string) => void) | undefined
): boolean {
  return mode === 'uncontrolled' || typeof onChangeText === 'function';
}
