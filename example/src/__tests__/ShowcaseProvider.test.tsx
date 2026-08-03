import React from 'react';
import { act, render } from '@testing-library/react-native';
import {
  createLogger,
  getLogLevel,
  setLogLevel,
} from '@unif/react-native-design';
import * as DesignRuntime from '@unif/react-native-design';
import {
  ShowcaseProvider,
  type ShowcaseContextValue,
} from '../state/ShowcaseProvider';
import { useShowcase } from '../state/useShowcase';

jest.mock('@unif/react-native-design', () => {
  const actual = jest.requireActual(
    '@unif/react-native-design'
  ) as typeof import('@unif/react-native-design');
  return {
    ...actual,
    removeTransport: jest.fn(actual.removeTransport),
  };
});

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

  const stateBeforeUnmount = showcase?.state;
  mounted.unmount();
  expect(DesignRuntime.removeTransport).toHaveBeenCalledTimes(1);
  expect(DesignRuntime.removeTransport).toHaveBeenCalledWith(
    'react-native-design-example-showcase'
  );
  expect(getLogLevel()).toBe('error');
  buttonLog.error('Button label 不能为空白，当前 action 已禁用。', password);
  expect(showcase?.state).toBe(stateBeforeUnmount);

  setLogLevel(originalLevel);
});
