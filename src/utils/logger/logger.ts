import { consoleTransport } from './transports/console';
import type { LogLevel, LogRecord, LogTransport, Logger } from './types';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const state = {
  level: (typeof __DEV__ !== 'undefined' && __DEV__
    ? 'debug'
    : 'warn') as LogLevel,
  transports: [consoleTransport] as LogTransport[],
};

function emit(
  level: LogLevel,
  scope: string,
  message: string,
  args: unknown[]
): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[state.level]) return;
  const record: LogRecord = {
    level,
    scope,
    message,
    args,
    ts: Date.now(),
  };
  for (const t of state.transports) {
    try {
      t.log(record);
    } catch {
      /* transport 异常隔离:绝不影响业务调用 */
    }
  }
}

export function createLogger(scope: string): Logger {
  return {
    debug: (message: string, ...args: unknown[]) =>
      emit('debug', scope, message, args),
    info: (message: string, ...args: unknown[]) =>
      emit('info', scope, message, args),
    warn: (message: string, ...args: unknown[]) =>
      emit('warn', scope, message, args),
    error: (message: string, ...args: unknown[]) =>
      emit('error', scope, message, args),
  };
}

export function setLogLevel(level: LogLevel): void {
  state.level = level;
}

export function getLogLevel(): LogLevel {
  return state.level;
}

export function addTransport(t: LogTransport): void {
  removeTransport(t.id);
  state.transports.push(t);
}

export function removeTransport(id: string): void {
  state.transports = state.transports.filter((t) => t.id !== id);
}
