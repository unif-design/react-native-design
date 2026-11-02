import { defaultLogBackend } from '@unif/react-native-logger';

export const createLogger = defaultLogBackend.createLogger;
export const setLogLevel = defaultLogBackend.setLogLevel;
export const getLogLevel = defaultLogBackend.getLogLevel;
export const addTransport = defaultLogBackend.addTransport;
export const removeTransport = defaultLogBackend.removeTransport;
export const consoleTransport = defaultLogBackend.consoleTransport;
export type {
  LogLevel,
  LogRecord,
  LogTransport,
  Logger,
} from '@unif/react-native-logger';
