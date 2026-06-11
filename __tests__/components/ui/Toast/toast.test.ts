import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { LogRecord } from '../../../../src/utils/logger';

type ToastModule = typeof import('../../../../src/components/ui/Toast/toast');
type LoggerModule = typeof import('../../../../src/utils/logger');

describe('toast — 命令式 API 逻辑(纯逻辑,无组件渲染)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('零订阅(未挂 <ToastHost />)时 toast() 告警提示消息被丢弃', () => {
    const { toast, _subs } =
      require('../../../../src/components/ui/Toast/toast') as ToastModule;
    const logger = require('../../../../src/utils/logger') as LoggerModule;
    const records: LogRecord[] = [];
    logger.setLogLevel('warn');
    logger.addTransport({ id: 'test-toast', log: (r) => records.push(r) });

    expect(_subs.size).toBe(0);
    toast('hi');

    expect(records.some((r) => r.level === 'warn' && r.scope === 'toast')).toBe(
      true
    );
  });

  test('有订阅者时 toast() 推送 entry 给订阅者,不告警', () => {
    const { toast, _subs } =
      require('../../../../src/components/ui/Toast/toast') as ToastModule;
    const logger = require('../../../../src/utils/logger') as LoggerModule;
    const records: LogRecord[] = [];
    logger.setLogLevel('warn');
    logger.addTransport({ id: 'test-toast-2', log: (r) => records.push(r) });

    let received: { message: string; kind: string } | null = null;
    _subs.add((e) => {
      received = e;
    });
    toast.success('订单提交成功');

    expect(received).toMatchObject({
      message: '订单提交成功',
      kind: 'success',
    });
    expect(records.some((r) => r.level === 'warn' && r.scope === 'toast')).toBe(
      false
    );
  });
});
