export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

export function createLogger(name: string, level: LogLevel = 'info'): Logger {
  const shouldLog = (target: LogLevel): boolean => {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(target) >= levels.indexOf(level);
  };

  const format = (lvl: LogLevel, message: string, data?: Record<string, unknown>): string => {
    const timestamp = new Date().toISOString();
    const base = `${timestamp} | ${lvl.toUpperCase()} | ${name} | ${message}`;
    return data ? `${base} | ${JSON.stringify(data)}` : base;
  };

  return {
    debug(message: string, data?: Record<string, unknown>) {
      if (shouldLog('debug')) console.debug(format('debug', message, data));
    },
    info(message: string, data?: Record<string, unknown>) {
      if (shouldLog('info')) console.info(format('info', message, data));
    },
    warn(message: string, data?: Record<string, unknown>) {
      if (shouldLog('warn')) console.warn(format('warn', message, data));
    },
    error(message: string, data?: Record<string, unknown>) {
      if (shouldLog('error')) console.error(format('error', message, data));
    },
  };
}
