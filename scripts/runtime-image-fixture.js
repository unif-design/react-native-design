#!/usr/bin/env node
'use strict';

const { Buffer } = require('node:buffer');
const http = require('node:http');

const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 8099;
const RUN_PATTERN = /^[A-Za-z0-9._-]{1,64}$/u;
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);
const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Accept, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': 'X-Fixture-Request-Id',
  'Cache-Control': 'no-store',
};

function parseCliOptions(argv) {
  const options = {
    help: false,
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (argument === '--host') {
      const host = argv[index + 1];
      if (!host || host.startsWith('-')) {
        throw new Error('--host 需要非空值');
      }
      options.host = host;
      index += 1;
      continue;
    }
    if (argument === '--port') {
      const rawPort = argv[index + 1];
      const port = Number(rawPort);
      if (
        rawPort === undefined ||
        !Number.isInteger(port) ||
        port < 1 ||
        port > 65_535
      ) {
        throw new Error('--port 必须是 1..65535 的整数');
      }
      options.port = port;
      index += 1;
      continue;
    }
    throw new Error(`未知参数: ${String(argument)}`);
  }

  return options;
}

function createRunState() {
  return {
    equivalent: {
      requests: 0,
      aborts: 0,
      releaseCalls: 0,
      releasedSuccesses: 0,
      pending: new Set(),
    },
    aba: {
      requests: 0,
      aborts: 0,
      secondSuccesses: 0,
      releaseCalls: 0,
      releasedErrors: 0,
      lateReleasesWithoutClient: 0,
      pendingFirst: null,
    },
    forbiddenRequests: 0,
  };
}

function serializeRunState(run, state) {
  return {
    run,
    equivalent: {
      requests: state.equivalent.requests,
      aborts: state.equivalent.aborts,
      pending: state.equivalent.pending.size,
      releaseCalls: state.equivalent.releaseCalls,
      releasedSuccesses: state.equivalent.releasedSuccesses,
    },
    aba: {
      requests: state.aba.requests,
      aborts: state.aba.aborts,
      pendingFirst: state.aba.pendingFirst === null ? 0 : 1,
      secondSuccesses: state.aba.secondSuccesses,
      releaseCalls: state.aba.releaseCalls,
      releasedErrors: state.aba.releasedErrors,
      lateReleasesWithoutClient: state.aba.lateReleasesWithoutClient,
    },
    forbiddenRequests: state.forbiddenRequests,
  };
}

function send(res, status, headers, body) {
  res.writeHead(status, {
    ...CORS_HEADERS,
    ...headers,
    'Content-Length': body.byteLength,
  });
  res.end(body);
}

function sendJson(res, status, value) {
  send(
    res,
    status,
    { 'Content-Type': 'application/json; charset=utf-8' },
    Buffer.from(`${JSON.stringify(value)}\n`)
  );
}

function sendPng(res, requestId) {
  send(
    res,
    200,
    {
      'Content-Type': 'image/png',
      'X-Fixture-Request-Id': requestId,
    },
    PNG
  );
}

/**
 * pending response 只允许 settle 一次。客户端断开与服务端 release 竞争时，
 * 由本地 boolean 决定唯一赢家，status 不会同时记 abort 与 release。
 */
function createPendingResponse(req, res, requestId, onAbort, onSettle) {
  let pending = true;

  const abort = () => {
    if (!pending) return;
    pending = false;
    onAbort();
  };

  req.once('aborted', abort);
  res.once('close', abort);

  return {
    requestId,
    respond(status, headers, body) {
      if (!pending) return false;
      if (res.destroyed) {
        abort();
        return false;
      }

      pending = false;
      onSettle();
      send(res, status, headers, body);
      return true;
    },
  };
}

function parseRun(url) {
  const run = url.searchParams.get('run');
  return run !== null && RUN_PATTERN.test(run) ? run : undefined;
}

function assertMethod(req, res, expected) {
  if (req.method === expected) return true;
  sendJson(res, 405, { error: `method must be ${expected}` });
  return false;
}

function createRuntimeImageFixture() {
  const runs = new Map();

  const stateFor = (run) => {
    const existing = runs.get(run);
    if (existing) return existing;

    const state = createRunState();
    runs.set(run, state);
    return state;
  };

  const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      send(res, 204, {}, Buffer.alloc(0));
      return;
    }

    let url;
    try {
      url = new URL(req.url ?? '/', 'http://runtime-image-fixture.local');
    } catch {
      sendJson(res, 400, { error: 'invalid URL' });
      return;
    }

    const run = parseRun(url);
    if (run === undefined) {
      sendJson(res, 400, { error: 'run query is required' });
      return;
    }
    const state = stateFor(run);

    if (url.pathname === '/status') {
      if (!assertMethod(req, res, 'GET')) return;
      sendJson(res, 200, serializeRunState(run, state));
      return;
    }

    if (url.pathname === '/equivalent.png') {
      if (!assertMethod(req, res, 'GET')) return;
      state.equivalent.requests += 1;
      const requestId = `equivalent-${state.equivalent.requests}`;
      let pendingResponse;
      pendingResponse = createPendingResponse(
        req,
        res,
        requestId,
        () => {
          state.equivalent.pending.delete(pendingResponse);
          state.equivalent.aborts += 1;
        },
        () => state.equivalent.pending.delete(pendingResponse)
      );
      state.equivalent.pending.add(pendingResponse);
      // 由 /release-equivalent 显式完成，便于在 pending 期间触发等价 render。
      return;
    }

    if (url.pathname === '/release-equivalent') {
      if (!assertMethod(req, res, 'POST')) return;
      state.equivalent.releaseCalls += 1;
      let released = 0;
      for (const pending of [...state.equivalent.pending]) {
        if (
          pending.respond(
            200,
            {
              'Content-Type': 'image/png',
              'X-Fixture-Request-Id': pending.requestId,
            },
            PNG
          )
        ) {
          released += 1;
        }
      }
      state.equivalent.releasedSuccesses += released;
      sendJson(res, 200, { released });
      return;
    }

    if (url.pathname === '/aba.png') {
      if (!assertMethod(req, res, 'GET')) return;
      state.aba.requests += 1;
      const requestOrdinal = state.aba.requests;
      if (requestOrdinal >= 2) {
        state.aba.secondSuccesses += 1;
        sendPng(res, `aba-${requestOrdinal}`);
        return;
      }

      let pendingResponse;
      pendingResponse = createPendingResponse(
        req,
        res,
        'aba-1',
        () => {
          if (state.aba.pendingFirst === pendingResponse) {
            state.aba.pendingFirst = null;
          }
          state.aba.aborts += 1;
        },
        () => {
          if (state.aba.pendingFirst === pendingResponse) {
            state.aba.pendingFirst = null;
          }
        }
      );
      state.aba.pendingFirst = pendingResponse;
      return;
    }

    if (url.pathname === '/release-a1') {
      if (!assertMethod(req, res, 'POST')) return;
      state.aba.releaseCalls += 1;
      const pending = state.aba.pendingFirst;
      const released =
        pending === null
          ? false
          : pending.respond(
              500,
              { 'Content-Type': 'text/plain; charset=utf-8' },
              Buffer.from('A1 released as a deterministic late error\n')
            );
      if (released) {
        state.aba.releasedErrors += 1;
      } else {
        state.aba.lateReleasesWithoutClient += 1;
      }
      sendJson(res, 200, { released: released ? 1 : 0 });
      return;
    }

    if (url.pathname === '/must-not-request.png') {
      if (!assertMethod(req, res, 'GET')) return;
      state.forbiddenRequests += 1;
      sendJson(res, 418, { error: 'invalid source reached the network' });
      return;
    }

    sendJson(res, 404, { error: 'not found' });
  });

  return {
    async listen({ host = '127.0.0.1', port = 0 } = {}) {
      await new Promise((resolve, reject) => {
        const onError = (error) => {
          server.off('listening', onListening);
          reject(error);
        };
        const onListening = () => {
          server.off('error', onError);
          resolve();
        };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, host);
      });

      const address = server.address();
      if (address === null || typeof address === 'string') {
        throw new Error('fixture 未返回 TCP address');
      }
      const addressHost = address.address.includes(':')
        ? `[${address.address}]`
        : address.address;
      return {
        host: address.address,
        port: address.port,
        origin: `http://${addressHost}:${address.port}`,
      };
    },

    async close() {
      for (const state of runs.values()) {
        for (const pending of [...state.equivalent.pending]) {
          pending.respond(
            503,
            { 'Content-Type': 'text/plain; charset=utf-8' },
            Buffer.from('fixture closing\n')
          );
        }
        state.aba.pendingFirst?.respond(
          503,
          { 'Content-Type': 'text/plain; charset=utf-8' },
          Buffer.from('fixture closing\n')
        );
      }
      if (!server.listening) return;

      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
        server.closeAllConnections?.();
      });
    },
  };
}

function printHelp() {
  console.log(`Usage: yarn runtime:image-fixture [--host HOST] [--port PORT]

默认监听 0.0.0.0:8099。每次人工验收使用新的 ?run=<id>。`);
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const fixture = createRuntimeImageFixture();
  const address = await fixture.listen(options);
  console.log(`[runtime-image-fixture] listening on ${address.origin}`);
  console.log(
    `[runtime-image-fixture] iOS simulator / Web: http://127.0.0.1:${address.port}`
  );
  console.log(
    `[runtime-image-fixture] Android emulator: http://10.0.2.2:${address.port}`
  );
  console.log(
    `[runtime-image-fixture] physical device: http://<host-lan-ip>:${address.port}`
  );

  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await fixture.close();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

module.exports = {
  createRuntimeImageFixture,
  parseCliOptions,
  serializeRunState,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(`[runtime-image-fixture] ${error.message}`);
    process.exitCode = 1;
  });
}
