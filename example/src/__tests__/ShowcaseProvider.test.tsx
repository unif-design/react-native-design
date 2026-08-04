import React from 'react';
import { act, render } from '@testing-library/react-native';
import {
  createLogger,
  getLogLevel,
  setLogLevel,
} from '@unif/react-native-design';
import * as DesignRuntime from '@unif/react-native-design';
import {
  installShowcaseLoggerTransport,
  ShowcaseProvider,
  type ShowcaseContextValue,
  type ShowcaseLoggerLifecycle,
} from '../state/ShowcaseProvider';
import { useShowcase } from '../state/useShowcase';

let showcase: ShowcaseContextValue | undefined;

function Probe() {
  showcase = useShowcase();
  return null;
}

beforeEach(() => {
  jest.clearAllMocks();
  showcase = undefined;
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('Provider 暴露 typed navigation、持久 scene draft 与 target reset', () => {
  render(
    <ShowcaseProvider>
      <Probe />
    </ShowcaseProvider>
  );

  act(() => {
    showcase?.updateScene('forms', (current) => ({
      ...current,
      inputValue: '切换后保留',
    }));
    showcase?.navigate('media');
  });
  expect(showcase?.state.navigation).toEqual(['home', 'media']);
  expect(showcase?.state.scenes.forms.inputValue).toBe('切换后保留');

  let consumed = false;
  act(() => {
    consumed = showcase?.back() ?? false;
  });
  expect(consumed).toBe(true);
  expect(showcase?.state.navigation).toEqual(['home']);

  act(() => {
    consumed = showcase?.back() ?? true;
  });
  expect(consumed).toBe(false);

  act(() => {
    showcase?.setThemeMode('dark');
    showcase?.setFontScale(1.5);
    showcase?.resetScene('forms');
  });
  expect(showcase?.state.themeMode).toBe('dark');
  expect(showcase?.state.fontScale).toBe(1.5);
  expect(showcase?.state.scenes.forms.inputValue).toBe('');
});

test('离开或重置 Feedback 时原子恢复 runtime Hosts', () => {
  render(
    <ShowcaseProvider>
      <Probe />
    </ShowcaseProvider>
  );

  expect(showcase?.state.runtimeHostsMounted).toBe(true);
  act(() => {
    showcase?.navigate('feedback');
    showcase?.setRuntimeHostsMounted(false);
  });
  expect(showcase?.state.runtimeHostsMounted).toBe(false);

  act(() => {
    showcase?.back();
  });
  expect(showcase?.state.navigation).toEqual(['home']);
  expect(showcase?.state.runtimeHostsMounted).toBe(true);

  act(() => {
    showcase?.navigate('feedback');
    showcase?.setRuntimeHostsMounted(false);
    showcase?.resetScene('feedback');
  });
  expect(showcase?.state.navigation).toEqual(['home', 'feedback']);
  expect(showcase?.state.runtimeHostsMounted).toBe(true);

  act(() => {
    showcase?.setRuntimeHostsMounted(false);
    showcase?.navigate('forms');
  });
  expect(showcase?.state.navigation).toEqual(['home', 'forms']);
  expect(showcase?.state.runtimeHostsMounted).toBe(true);
});

test('custom logger transport 只映射白名单安全摘要并在 unmount 恢复', () => {
  const originalLevel = getLogLevel();
  setLogLevel('error');
  const mounted = render(
    <ShowcaseProvider>
      <Probe />
    </ShowcaseProvider>
  );
  const buttonLog = createLogger('Button');
  const password = 'logger-must-not-store-this';
  const imageUri = 'file:///private/logger-photo.jpg';

  expect(getLogLevel()).toBe('info');
  act(() => {
    buttonLog.warn(
      'Button label 不能为空白，当前 action 已禁用。',
      { password, uri: imageUri },
      password
    );
  });
  expect(showcase?.state.results).toEqual([
    {
      id: 1,
      scene: 'actions',
      component: 'Button',
      action: '运行时保护',
      summary: 'Button label 为空，操作已禁用',
    },
  ]);
  expect(JSON.stringify(showcase?.state)).not.toContain(password);
  expect(JSON.stringify(showcase?.state)).not.toContain(imageUri);

  act(() => {
    createLogger('FoundationScene').info(
      '主题诊断示例已记录',
      { password, uri: imageUri },
      password
    );
    createLogger('UnknownScope').warn(
      'Button label 不能为空白，当前 action 已禁用。',
      password
    );
    createLogger('Button').warn('未知消息', password);
  });
  expect(showcase?.state.results).toEqual([
    {
      id: 2,
      scene: 'foundation',
      component: 'Logger',
      action: '记录',
      summary: '主题诊断示例已记录',
    },
    {
      id: 1,
      scene: 'actions',
      component: 'Button',
      action: '运行时保护',
      summary: 'Button label 为空，操作已禁用',
    },
  ]);
  expect(JSON.stringify(showcase?.state)).not.toContain(password);
  expect(JSON.stringify(showcase?.state)).not.toContain(imageUri);

  mounted.unmount();
  expect(getLogLevel()).toBe('error');

  setLogLevel(originalLevel);
});

test('logger cleanup 先移除 active transport 再恢复旧 level', () => {
  const originalLevel = getLogLevel();
  setLogLevel('error');
  const events: string[] = [];
  const appendResult = jest.fn();
  const lifecycle: ShowcaseLoggerLifecycle = {
    getLogLevel() {
      return getLogLevel();
    },
    setLogLevel(level) {
      events.push(`set:${level}`);
      setLogLevel(level);
    },
    addTransport(transport) {
      events.push(`add:${transport.id}`);
      DesignRuntime.addTransport(transport);
    },
    removeTransport(id) {
      events.push(`remove:${id}`);
      DesignRuntime.removeTransport(id);
    },
  };
  const cleanup = installShowcaseLoggerTransport(appendResult, lifecycle);
  let cleanedUp = false;

  try {
    createLogger('FoundationScene').info('主题诊断示例已记录', {
      password: 'ignored-before-cleanup',
    });
    expect(appendResult).toHaveBeenCalledTimes(1);

    const cleanupEventStart = events.length;
    cleanup();
    cleanedUp = true;
    expect(events.slice(cleanupEventStart)).toEqual([
      'remove:react-native-design-example-showcase',
      'set:error',
    ]);

    createLogger('Button').error(
      'Button label 不能为空白，当前 action 已禁用。',
      'must-not-reach-removed-transport'
    );
    expect(appendResult).toHaveBeenCalledTimes(1);
  } finally {
    if (!cleanedUp) cleanup();
    setLogLevel(originalLevel);
  }
});
