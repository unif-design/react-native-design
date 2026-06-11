import { beforeEach, describe, expect, jest, test } from '@jest/globals';

type ConfirmModule =
  typeof import('../../../../src/components/ui/Confirm/confirm');
const load = (): ConfirmModule =>
  require('../../../../src/components/ui/Confirm/confirm');

describe('confirm — 命令式 API 逻辑(纯逻辑,无组件渲染)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('无 ConfirmHost(零订阅)时立即 resolve(false),不悬挂', async () => {
    const { confirm } = load();
    await expect(confirm({ title: 'x' })).resolves.toBe(false);
  }, 2000);

  test('零订阅的 confirm 不占单例锁 —— 之后挂 Host 仍能正常弹出', async () => {
    const { confirm, _subs } = load();
    expect(await confirm({ title: 'x' })).toBe(false); // 零订阅 → false,且不占锁
    let received: { resolve: (b: boolean) => void } | null = null;
    _subs.add((e) => {
      if (e) received = e;
    });
    const p = confirm({ title: 'y' });
    expect(received).not.toBeNull(); // entry 真的发出 = 单例锁没被上一次占住
    received!.resolve(true);
    await expect(p).resolves.toBe(true);
  }, 2000);

  test('已有活跃对话框时重入立即 resolve(false)(回归)', async () => {
    const { confirm, _subs } = load();
    _subs.add(() => {}); // 模拟 Host 挂载但不 resolve(对话框停在显示中)
    confirm({ title: 'a' }); // 占用活跃
    await expect(confirm({ title: 'b' })).resolves.toBe(false);
  });
});
