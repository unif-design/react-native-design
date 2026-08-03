import { afterEach, describe, expect, test } from '@jest/globals';
import {
  createRuntimeImageFixture,
  parseCliOptions,
} from '../../scripts/runtime-image-fixture';

type Fixture = ReturnType<typeof createRuntimeImageFixture>;
type FixtureStatus = {
  run: string;
  equivalent: {
    requests: number;
    aborts: number;
    pending: number;
    releaseCalls: number;
    releasedSuccesses: number;
  };
  aba: {
    requests: number;
    aborts: number;
    pendingFirst: number;
    secondSuccesses: number;
    releaseCalls: number;
    releasedErrors: number;
    lateReleasesWithoutClient: number;
  };
  forbiddenRequests: number;
};

const fixtures: Fixture[] = [];

async function startFixture() {
  const fixture = createRuntimeImageFixture();
  fixtures.push(fixture);
  const address = await fixture.listen({ host: '127.0.0.1', port: 0 });
  return { fixture, origin: address.origin };
}

async function readStatus(origin: string, run: string): Promise<FixtureStatus> {
  const response = await fetch(`${origin}/status?run=${run}`);
  expect(response.status).toBe(200);
  return (await response.json()) as FixtureStatus;
}

async function waitForStatus(
  origin: string,
  run: string,
  predicate: (status: FixtureStatus) => boolean
): Promise<FixtureStatus> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const status = await readStatus(origin, run);
    if (predicate(status)) return status;
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 5));
  }
  throw new Error(`fixture status timeout: run=${run}`);
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.close()));
});

describe('runtime-image-fixture CLI', () => {
  test('使用可复现默认值并严格解析 host / port', () => {
    expect(parseCliOptions([])).toEqual({
      help: false,
      host: '0.0.0.0',
      port: 8099,
    });
    expect(parseCliOptions(['--host', '127.0.0.1', '--port', '9000'])).toEqual({
      help: false,
      host: '127.0.0.1',
      port: 9000,
    });
    expect(parseCliOptions(['--help'])).toEqual({
      help: true,
      host: '0.0.0.0',
      port: 8099,
    });
    expect(() => parseCliOptions(['--port', '0'])).toThrow('port');
    expect(() => parseCliOptions(['--unknown'])).toThrow('--unknown');
  });
});

describe('runtime-image-fixture HTTP contract', () => {
  test('OPTIONS / status 提供 CORS，run 必填且不同 run 完全隔离', async () => {
    const { origin } = await startFixture();
    const options = await fetch(`${origin}/equivalent.png?run=one`, {
      method: 'OPTIONS',
    });
    expect(options.status).toBe(204);
    expect(options.headers.get('access-control-allow-origin')).toBe('*');
    expect(options.headers.get('access-control-allow-methods')).toContain(
      'POST'
    );

    const missingRun = await fetch(`${origin}/status`);
    expect(missingRun.status).toBe(400);

    expect(await readStatus(origin, 'one')).toMatchObject({
      run: 'one',
      equivalent: { requests: 0 },
      aba: { requests: 0 },
    });
    expect(await readStatus(origin, 'two')).toMatchObject({
      run: 'two',
      equivalent: { requests: 0 },
      aba: { requests: 0 },
    });
  });

  test('equivalent 请求保持 pending，显式 release 后只完成既有请求', async () => {
    const { origin } = await startFixture();
    const imagePromise = fetch(`${origin}/equivalent.png?run=equivalent`);

    await waitForStatus(
      origin,
      'equivalent',
      (status) => status.equivalent.pending === 1
    );
    const release = await fetch(`${origin}/release-equivalent?run=equivalent`, {
      method: 'POST',
    });
    expect(await release.json()).toEqual({ released: 1 });

    const image = await imagePromise;
    expect(image.status).toBe(200);
    expect(image.headers.get('content-type')).toBe('image/png');
    expect(image.headers.get('x-fixture-request-id')).toBe('equivalent-1');

    expect(await readStatus(origin, 'equivalent')).toMatchObject({
      equivalent: {
        requests: 1,
        aborts: 0,
        pending: 0,
        releaseCalls: 1,
        releasedSuccesses: 1,
      },
    });
  });

  test('equivalent 客户端 abort 被计数，release 不会伪造成功', async () => {
    const { origin } = await startFixture();
    const controller = new AbortController();
    const imagePromise = fetch(`${origin}/equivalent.png?run=abort`, {
      signal: controller.signal,
    });

    await waitForStatus(
      origin,
      'abort',
      (status) => status.equivalent.pending === 1
    );
    controller.abort();
    await expect(imagePromise).rejects.toThrow();
    await waitForStatus(
      origin,
      'abort',
      (status) => status.equivalent.aborts === 1
    );

    const release = await fetch(`${origin}/release-equivalent?run=abort`, {
      method: 'POST',
    });
    expect(await release.json()).toEqual({ released: 0 });

    const retryPromise = fetch(`${origin}/equivalent.png?run=abort`);
    await waitForStatus(
      origin,
      'abort',
      (status) => status.equivalent.pending === 1
    );
    const retryRelease = await fetch(`${origin}/release-equivalent?run=abort`, {
      method: 'POST',
    });
    expect(await retryRelease.json()).toEqual({ released: 1 });
    const retry = await retryPromise;
    expect(retry.headers.get('x-fixture-request-id')).toBe('equivalent-2');

    expect(await readStatus(origin, 'abort')).toMatchObject({
      equivalent: {
        requests: 2,
        aborts: 1,
        pending: 0,
        releaseCalls: 2,
        releasedSuccesses: 1,
      },
    });
  });

  test('ABA 第一次 pending、第二次成功；仍连接的 A1 可被释放为 error', async () => {
    const { origin } = await startFixture();
    const firstPromise = fetch(`${origin}/aba.png?run=aba-connected`);
    await waitForStatus(
      origin,
      'aba-connected',
      (status) => status.aba.pendingFirst === 1
    );

    const second = await fetch(`${origin}/aba.png?run=aba-connected`);
    expect(second.status).toBe(200);
    expect(second.headers.get('x-fixture-request-id')).toBe('aba-2');

    const release = await fetch(`${origin}/release-a1?run=aba-connected`, {
      method: 'POST',
    });
    expect(await release.json()).toEqual({ released: 1 });
    expect((await firstPromise).status).toBe(500);
    expect(await readStatus(origin, 'aba-connected')).toMatchObject({
      aba: {
        requests: 2,
        aborts: 0,
        pendingFirst: 0,
        secondSuccesses: 1,
        releaseCalls: 1,
        releasedErrors: 1,
        lateReleasesWithoutClient: 0,
      },
    });
  });

  test('ABA A1 已 abort 时 late release 只记 no-client，不伪称触发旧 handler', async () => {
    const { origin } = await startFixture();
    const controller = new AbortController();
    const firstPromise = fetch(`${origin}/aba.png?run=aba-aborted`, {
      signal: controller.signal,
    });
    await waitForStatus(
      origin,
      'aba-aborted',
      (status) => status.aba.pendingFirst === 1
    );
    controller.abort();
    await expect(firstPromise).rejects.toThrow();
    await waitForStatus(
      origin,
      'aba-aborted',
      (status) => status.aba.aborts === 1
    );

    const release = await fetch(`${origin}/release-a1?run=aba-aborted`, {
      method: 'POST',
    });
    expect(await release.json()).toEqual({ released: 0 });
    expect(await readStatus(origin, 'aba-aborted')).toMatchObject({
      aba: {
        requests: 1,
        aborts: 1,
        pendingFirst: 0,
        releaseCalls: 1,
        releasedErrors: 0,
        lateReleasesWithoutClient: 1,
      },
    });
  });

  test('must-not-request endpoint 显式计数，便于发现非法 source 意外发网', async () => {
    const { origin } = await startFixture();
    const response = await fetch(
      `${origin}/must-not-request.png?run=forbidden`
    );

    expect(response.status).toBe(418);
    expect(await readStatus(origin, 'forbidden')).toMatchObject({
      forbiddenRequests: 1,
    });
  });
});
