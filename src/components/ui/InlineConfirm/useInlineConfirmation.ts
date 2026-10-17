import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InlineConfirmContext } from './context';
import type { InlineConfirmationOptions, InlineConfirmOwner } from './types';

export function useInlineConfirmation(
  props: InlineConfirmationOptions,
  containsTarget: InlineConfirmOwner['containsTarget']
) {
  const scope = useContext(InlineConfirmContext);
  const latest = useRef(props);
  latest.current = props;
  const mounted = useRef(false);
  const active = useRef(false);
  const activeKey = useRef(props.confirmationKey);
  const generation = useRef(0);
  const [presentation, setPresentation] = useState({
    confirming: false,
    generation: 0,
  });
  const owner = useRef<InlineConfirmOwner | undefined>(undefined);

  const cancel = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    generation.current += 1;
    if (mounted.current)
      setPresentation({ confirming: false, generation: generation.current });
    // identity is assigned before effects or event handlers can call cancel.
    scope?.release(owner.current!);
    // 宿主已撤回本项时只释放显示，避免 A → B 换目标后又清掉 B。
    if (mounted.current && latest.current.confirming !== false)
      latest.current.onCancel?.();
  }, [scope]);
  const identity = useMemo(
    () => ({ cancel, containsTarget }),
    [cancel, containsTarget]
  );
  owner.current = identity;
  const activate = useCallback(() => {
    active.current = true;
    activeKey.current = latest.current.confirmationKey;
    generation.current += 1;
    setPresentation({ confirming: true, generation: generation.current });
    scope?.claim(identity);
  }, [identity, scope]);

  const previous = useRef<
    | {
        key: InlineConfirmationOptions['confirmationKey'];
        controlled: boolean | undefined;
      }
    | undefined
  >(undefined);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      const wasActive = active.current;
      mounted.current = false;
      cancel();
      scope?.release(identity);
      // React 可重放生命周期；卸载只失活旧回调，不向宿主交付用户取消。
      if (wasActive) previous.current = undefined;
    };
  }, [cancel, identity, scope]);

  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = {
      key: props.confirmationKey,
      controlled: props.confirming,
    };
    if (
      (old && old.key !== props.confirmationKey) ||
      props.disabled ||
      props.loading
    ) {
      if (active.current) cancel();
      else {
        generation.current += 1;
        setPresentation({ confirming: false, generation: generation.current });
        // 首次受控请求也可能已不可用；交回宿主撤回，避免保留无法消费的 true。
        if (props.confirming === true && old?.controlled !== true)
          latest.current.onCancel?.();
      }
      return;
    }
    if (props.confirming === false) cancel();
    else if (props.confirming === true && old?.controlled !== true) activate();
  }, [
    props.confirmationKey,
    props.confirming,
    props.disabled,
    props.loading,
    activate,
    cancel,
  ]);

  const key = props.confirmationKey;
  const press = () => {
    const current = latest.current;
    // 过期渲染、目标换代与同一批重复事件都不能借用下一次确认。
    if (
      !mounted.current ||
      current.disabled ||
      current.loading ||
      key !== current.confirmationKey ||
      presentation.generation !== generation.current
    )
      return;
    if (active.current) {
      if (activeKey.current !== current.confirmationKey) return;
      active.current = false;
      generation.current += 1;
      setPresentation({ confirming: false, generation: generation.current });
      scope?.release(identity);
      current.onConfirm();
    } else {
      // 宿主尚未清理已消费的 true 时，不能再次请求或确认。
      if (current.confirming === true) return;
      if (current.confirming === undefined) activate();
      current.onPress?.();
    }
  };
  return { confirming: presentation.confirming, press };
}
