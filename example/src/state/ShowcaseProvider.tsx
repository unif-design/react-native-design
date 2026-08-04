import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  addTransport,
  getLogLevel,
  removeTransport,
  setLogLevel,
  type LogLevel,
  type LogRecord,
  type LogTransport,
} from '@unif/react-native-design';
import type { SceneId } from '../catalog/componentCatalog';
import {
  back as backNavigation,
  navigate as navigateToScene,
  shouldConsumeHardwareBack,
} from '../navigation/exampleNavigation';
import {
  appendShowcaseResult,
  clearShowcaseResults,
  createInitialShowcaseState,
  resetShowcaseScene,
  setShowcaseFontScale,
  setShowcaseThemeMode,
  updateShowcaseScene,
  type FontScalePreset,
  type SafeResultInput,
  type SceneStateMap,
  type ShowcaseState,
  type ThemeMode,
} from './showcaseState';

export type ShowcaseContextValue = {
  state: ShowcaseState;
  navigate: (scene: SceneId) => void;
  back: () => boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setFontScale: (scale: FontScalePreset) => void;
  setRuntimeHostsMounted: (mounted: boolean) => void;
  updateScene: <K extends SceneId>(
    scene: K,
    updater: (current: SceneStateMap[K]) => SceneStateMap[K]
  ) => void;
  resetScene: (scene: SceneId) => void;
  appendResult: (input: SafeResultInput) => void;
  clearResults: () => void;
};

type SafeLogMapping = Readonly<{
  scope: string;
  message: string;
  result: SafeResultInput;
}>;

const SHOWCASE_LOG_TRANSPORT_ID = 'react-native-design-example-showcase';

const SAFE_LOG_MAPPINGS: readonly SafeLogMapping[] = [
  {
    scope: 'FoundationScene',
    message: '主题诊断示例已记录',
    result: {
      scene: 'foundation',
      component: 'Logger',
      action: '记录',
      summary: '主题诊断示例已记录',
    },
  },
  {
    scope: 'Button',
    message: 'Button label 不能为空白，当前 action 已禁用。',
    result: {
      scene: 'actions',
      component: 'Button',
      action: '运行时保护',
      summary: 'Button label 为空，操作已禁用',
    },
  },
];

function safeResultForLog(record: LogRecord): SafeResultInput | undefined {
  return SAFE_LOG_MAPPINGS.find(
    (mapping) =>
      mapping.scope === record.scope && mapping.message === record.message
  )?.result;
}

export type ShowcaseLoggerLifecycle = Readonly<{
  getLogLevel: () => LogLevel;
  setLogLevel: (level: LogLevel) => void;
  addTransport: (transport: LogTransport) => void;
  removeTransport: (id: string) => void;
}>;

const defaultShowcaseLoggerLifecycle: ShowcaseLoggerLifecycle = {
  getLogLevel,
  setLogLevel,
  addTransport,
  removeTransport,
};

export function installShowcaseLoggerTransport(
  appendResult: (input: SafeResultInput) => void,
  lifecycle: ShowcaseLoggerLifecycle = defaultShowcaseLoggerLifecycle
): () => void {
  const previousLevel = lifecycle.getLogLevel();
  const transport: LogTransport = {
    id: SHOWCASE_LOG_TRANSPORT_ID,
    log(record) {
      const safeResult = safeResultForLog(record);
      if (safeResult) appendResult(safeResult);
    },
  };

  lifecycle.setLogLevel('info');
  lifecycle.addTransport(transport);
  return () => {
    lifecycle.removeTransport(SHOWCASE_LOG_TRANSPORT_ID);
    lifecycle.setLogLevel(previousLevel);
  };
}

export const ShowcaseContext = createContext<ShowcaseContextValue | undefined>(
  undefined
);

export function ShowcaseProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const [state, setState] = useState(createInitialShowcaseState);
  const stateRef = useRef(state);

  const commit = useCallback(
    (updater: (current: ShowcaseState) => ShowcaseState) => {
      const current = stateRef.current;
      const next = updater(current);
      if (next === current) return;
      stateRef.current = next;
      setState(next);
    },
    []
  );

  const navigate = useCallback(
    (scene: SceneId) => {
      commit((current) => ({
        ...current,
        navigation: navigateToScene(current.navigation, scene),
        runtimeHostsMounted: true,
      }));
    },
    [commit]
  );

  const back = useCallback((): boolean => {
    const shouldConsume = shouldConsumeHardwareBack(
      stateRef.current.navigation
    );
    if (!shouldConsume) return false;
    commit((current) => ({
      ...current,
      navigation: backNavigation(current.navigation),
      runtimeHostsMounted: true,
    }));
    return true;
  }, [commit]);

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      commit((current) => setShowcaseThemeMode(current, mode));
    },
    [commit]
  );

  const setFontScale = useCallback(
    (scale: FontScalePreset) => {
      commit((current) => setShowcaseFontScale(current, scale));
    },
    [commit]
  );

  const setRuntimeHostsMounted = useCallback(
    (mounted: boolean) => {
      commit((current) =>
        current.runtimeHostsMounted === mounted
          ? current
          : { ...current, runtimeHostsMounted: mounted }
      );
    },
    [commit]
  );

  const updateScene = useCallback(
    <K extends SceneId>(
      scene: K,
      updater: (current: SceneStateMap[K]) => SceneStateMap[K]
    ) => {
      commit((current) => updateShowcaseScene(current, scene, updater));
    },
    [commit]
  );

  const resetScene = useCallback(
    (scene: SceneId) => {
      commit((current) => {
        const reset = resetShowcaseScene(current, scene);
        return scene === 'feedback'
          ? { ...reset, runtimeHostsMounted: true }
          : reset;
      });
    },
    [commit]
  );

  const appendResult = useCallback(
    (input: SafeResultInput) => {
      commit((current) => appendShowcaseResult(current, input));
    },
    [commit]
  );

  const clearResults = useCallback(() => {
    commit(clearShowcaseResults);
  }, [commit]);

  useEffect(() => installShowcaseLoggerTransport(appendResult), [appendResult]);

  const value = useMemo<ShowcaseContextValue>(
    () => ({
      state,
      navigate,
      back,
      setThemeMode,
      setFontScale,
      setRuntimeHostsMounted,
      updateScene,
      resetScene,
      appendResult,
      clearResults,
    }),
    [
      appendResult,
      back,
      clearResults,
      navigate,
      resetScene,
      setFontScale,
      setRuntimeHostsMounted,
      setThemeMode,
      state,
      updateScene,
    ]
  );

  return (
    <ShowcaseContext.Provider value={value}>
      {children}
    </ShowcaseContext.Provider>
  );
}
