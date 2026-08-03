import { describe, expect, test } from '@jest/globals';
import {
  buildVersionPillLabel,
  resolveVersionStatus,
} from '../../../../src/components/business/VersionPill/content';
import { lightColors } from '../../../../src/theme';

describe('VersionPill content', () => {
  test('status 默认正常，caller 无 color 使用中性色', () => {
    expect(resolveVersionStatus(undefined, lightColors)).toEqual({
      label: '正常',
      color: lightColors.success,
      diagnostics: [],
    });
    expect(resolveVersionStatus({ label: '测试中' }, lightColors)).toEqual({
      label: '测试中',
      color: lightColors.foregroundMuted,
      diagnostics: [],
    });
  });

  test('caller 显式 color 原样保留', () => {
    expect(
      resolveVersionStatus(
        { label: '已废', color: lightColors.error },
        lightColors
      )
    ).toEqual({
      label: '已废',
      color: lightColors.error,
      diagnostics: [],
    });
  });

  test.each(['', '   ', '\t'])(
    '空白 status label 使用非颜色语义并记诊断',
    (label) => {
      expect(
        resolveVersionStatus({ label, color: lightColors.error }, lightColors)
      ).toEqual({
        label: '状态未知',
        color: lightColors.error,
        diagnostics: ['status.label'],
      });
    }
  );

  test('组合名称含 version、build 和 status', () => {
    expect(
      buildVersionPillLabel({
        version: '2.0.0',
        build: '12',
        statusLabel: '测试中',
        versionPrefix: '版本 ',
        buildPrefix: 'build ',
      })
    ).toBe('版本 2.0.0，build 12，测试中');
  });

  test('空 build 从组合名称省略', () => {
    expect(
      buildVersionPillLabel({
        version: '2.0.0',
        build: '',
        statusLabel: '正常',
        versionPrefix: '版本 ',
        buildPrefix: 'build ',
      })
    ).toBe('版本 2.0.0，正常');
  });
});
