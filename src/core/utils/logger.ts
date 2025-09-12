export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  file?: string;
  line?: number;
  element?: string;
  stack?: string;
  suggestion?: string;
  [key: string]: unknown;
}

export interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: number;
  args?: unknown[];
  context: LogContext;
}

export interface LoggerConfig {
  minLevel?: LogLevel;
  formatter?: (message: LogMessage) => string;
  enabled?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
  dim: '\x1b[2m',
};

export function formatLogMessage(message: LogMessage): string {
  const { level, message: msg, timestamp, args = [], context } = message;
  const date = new Date(timestamp);
  const timeStr = date.toISOString().split('T')[1].slice(0, -1);

  const color = LOG_COLORS[level];
  const reset = LOG_COLORS.reset;
  const dim = LOG_COLORS.dim;

  let output = `${dim}[${timeStr}]${reset} ${color}[${level.toUpperCase()}]${reset}`;

  if (context.file) {
    output += ` ${dim}${context.file}`;
    if (context.line) {
      output += `:${context.line}`;
    }
    output += reset;
  }

  output += ` ${msg}`;

  if (args.length > 0) {
    const formattedArgs = args.map((arg) => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    });
    output += ' ' + formattedArgs.join(' ');
  }

  if (context.element) {
    output += `\n  ${dim}Element:${reset} ${context.element}`;
  }

  if (context.suggestion) {
    output += `\n  ${color}Suggestion:${reset} ${context.suggestion}`;
  }

  if (context.stack) {
    output += `\n  ${dim}Stack:${reset}\n`;
    const stackLines = context.stack.split('\n').slice(1, 6);
    stackLines.forEach((line) => {
      output += `    ${dim}${line.trim()}${reset}\n`;
    });
  }

  return output;
}

export function parseStackTrace(stack?: string): {
  file?: string;
  line?: number;
} {
  if (!stack) return {};

  const lines = stack.split('\n');
  for (const line of lines) {
    const match = line.match(/at\s+.*?\s+\(?(.*?):(\d+):\d+\)?/);
    if (match) {
      return {
        file: match[1],
        line: parseInt(match[2], 10),
      };
    }
  }

  return {};
}

export class Logger {
  private config: LoggerConfig;
  private context: LogContext;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      minLevel: 'debug',
      enabled: true,
      ...config,
    };
    this.context = {};
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    const minLevel = LOG_LEVELS[this.config.minLevel || 'debug'];
    return LOG_LEVELS[level] >= minLevel;
  }

  private createMessage(
    level: LogLevel,
    message: unknown,
    args: unknown[]
  ): LogMessage {
    let msg: string;
    let context = { ...this.context };

    if (message instanceof Error) {
      msg = message.message;
      context.stack = message.stack;
      const stackInfo = parseStackTrace(message.stack);
      if (!context.file) context.file = stackInfo.file;
      if (!context.line) context.line = stackInfo.line;
    } else if (typeof message === 'object') {
      try {
        msg = JSON.stringify(message);
      } catch {
        msg = String(message);
      }
    } else {
      msg = String(message);
    }

    return {
      level,
      message: msg,
      timestamp: Date.now(),
      args: args.length > 0 ? args : undefined,
      context,
    };
  }

  private log(level: LogLevel, message: unknown, ...args: unknown[]): void {
    if (!this.shouldLog(level)) return;

    const logMessage = this.createMessage(level, message, args);
    const formatted = this.config.formatter
      ? this.config.formatter(logMessage)
      : formatLogMessage(logMessage);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: unknown, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  info(message: unknown, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  warn(message: unknown, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: unknown, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }

  withContext(context: LogContext): Logger {
    const logger = new Logger(this.config);
    logger.context = { ...this.context, ...context };
    return logger;
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const logger = new Logger();
