import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { LogMessage } from '../../../../src/core/utils/logger';
import {
  formatLogMessage,
  Logger,
  parseStackTrace,
} from '../../../../src/core/utils/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: any;

  beforeEach(() => {
    logger = new Logger();
    consoleSpy = {
      log: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      debug: mock(() => {}),
    };
    (global as any).console = consoleSpy;
  });

  describe('formatLogMessage', () => {
    it('should format basic log message', () => {
      const message: LogMessage = {
        level: 'info',
        message: 'Test message',
        timestamp: 1234567890,
        context: {},
      };

      const formatted = formatLogMessage(message);
      expect(formatted).toContain('[INFO]');
      expect(formatted).toContain('Test message');
    });

    it('should include file and line context', () => {
      const message: LogMessage = {
        level: 'error',
        message: 'Error occurred',
        timestamp: 1234567890,
        context: {
          file: 'src/test.ts',
          line: 42,
        },
      };

      const formatted = formatLogMessage(message);
      expect(formatted).toContain('src/test.ts:42');
      expect(formatted).toContain('[ERROR]');
    });

    it('should include element context', () => {
      const message: LogMessage = {
        level: 'warn',
        message: 'Element warning',
        timestamp: 1234567890,
        context: {
          element: '<box position="0,0,0" />',
        },
      };

      const formatted = formatLogMessage(message);
      expect(formatted).toContain('<box position="0,0,0" />');
    });

    it('should include stack trace for errors', () => {
      const message: LogMessage = {
        level: 'error',
        message: 'Stack trace test',
        timestamp: 1234567890,
        context: {
          stack:
            'Error: Test\n    at function1 (file.ts:10:5)\n    at function2 (file.ts:20:10)',
        },
      };

      const formatted = formatLogMessage(message);
      expect(formatted).toContain('Stack:');
      expect(formatted).toContain('at function1');
    });

    it('should include suggestion when provided', () => {
      const message: LogMessage = {
        level: 'error',
        message: 'Missing attribute',
        timestamp: 1234567890,
        context: {
          suggestion: 'Did you mean to add a "position" attribute?',
        },
      };

      const formatted = formatLogMessage(message);
      expect(formatted).toContain('Suggestion:');
      expect(formatted).toContain(
        'Did you mean to add a "position" attribute?'
      );
    });

    it('should handle multiple arguments', () => {
      const message: LogMessage = {
        level: 'debug',
        message: 'Debug output',
        timestamp: 1234567890,
        args: ['value1', 42, { key: 'value' }],
        context: {},
      };

      const formatted = formatLogMessage(message);
      expect(formatted).toContain('value1');
      expect(formatted).toContain('42');
      expect(formatted).toContain('{"key":"value"}');
    });
  });

  describe('parseStackTrace', () => {
    it('should extract file and line from error stack', () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at Object.<anonymous> (/path/to/file.ts:10:15)
    at Module._compile (node:internal/modules:123:45)`;

      const result = parseStackTrace(error.stack);
      expect(result.file).toBe('/path/to/file.ts');
      expect(result.line).toBe(10);
    });

    it('should handle stack without file info', () => {
      const result = parseStackTrace('Error: Test\n    at <anonymous>');
      expect(result.file).toBeUndefined();
      expect(result.line).toBeUndefined();
    });
  });

  describe('Logger methods', () => {
    it('should log at debug level', () => {
      logger.debug('Debug message', 'extra', 123);
      expect(consoleSpy.debug).toHaveBeenCalled();
      const call = consoleSpy.debug.mock.calls[0];
      expect(call[0]).toContain('[DEBUG]');
      expect(call[0]).toContain('Debug message');
    });

    it('should log at info level', () => {
      logger.info('Info message');
      expect(consoleSpy.log).toHaveBeenCalled();
      const call = consoleSpy.log.mock.calls[0];
      expect(call[0]).toContain('[INFO]');
      expect(call[0]).toContain('Info message');
    });

    it('should log at warn level', () => {
      logger.warn('Warning message');
      expect(consoleSpy.warn).toHaveBeenCalled();
      const call = consoleSpy.warn.mock.calls[0];
      expect(call[0]).toContain('[WARN]');
      expect(call[0]).toContain('Warning message');
    });

    it('should log at error level', () => {
      logger.error('Error message');
      expect(consoleSpy.error).toHaveBeenCalled();
      const call = consoleSpy.error.mock.calls[0];
      expect(call[0]).toContain('[ERROR]');
      expect(call[0]).toContain('Error message');
    });

    it('should capture stack trace for errors', () => {
      const error = new Error('Test error');
      logger.error(error);
      expect(consoleSpy.error).toHaveBeenCalled();
      const call = consoleSpy.error.mock.calls[0];
      expect(call[0]).toContain('Stack:');
    });

    it('should handle context override', () => {
      logger.withContext({ element: '<test />' }).warn('Context warning');
      expect(consoleSpy.warn).toHaveBeenCalled();
      const call = consoleSpy.warn.mock.calls[0];
      expect(call[0]).toContain('<test />');
    });
  });

  describe('Logger configuration', () => {
    it('should respect minimum log level', () => {
      const warnLogger = new Logger({ minLevel: 'warn' });
      warnLogger.debug('Debug message');
      warnLogger.info('Info message');
      warnLogger.warn('Warn message');
      warnLogger.error('Error message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should use custom formatter', () => {
      const customLogger = new Logger({
        formatter: (msg) => `CUSTOM: ${msg.message}`,
      });
      customLogger.info('Test');
      expect(consoleSpy.log).toHaveBeenCalled();
      expect(consoleSpy.log.mock.calls[0][0]).toBe('CUSTOM: Test');
    });
  });
});
