import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { Plugin, ViteDevServer, WebSocketServer } from 'vite';
import { consoleForwarding } from '../../../src/vite/console-plugin';

describe('Console Forwarding Plugin', () => {
  let plugin: Plugin;
  let mockServer: Partial<ViteDevServer>;
  let mockWs: Partial<WebSocketServer>;
  let originalConsole: typeof console;

  beforeEach(() => {
    originalConsole = { ...console };

    mockWs = {
      on: mock(() => {}) as any,
      send: mock(() => {}) as any,
      clients: new Set(),
    };

    mockServer = {
      ws: mockWs as WebSocketServer,
      middlewares: {
        use: mock(() => {}),
      } as any,
    };

    const plugins = consoleForwarding();
    plugin = Array.isArray(plugins) ? plugins[0] : plugins;
  });

  afterEach(() => {
    global.console = originalConsole;
  });

  describe('Plugin Structure', () => {
    it('should have correct plugin name', () => {
      expect(plugin.name).toBe('vibegame:console-forwarding');
    });

    it('should only apply in serve mode', () => {
      if (typeof plugin.apply === 'function') {
        expect(
          plugin.apply({}, { command: 'serve', mode: 'development' })
        ).toBe(true);
        expect(plugin.apply({}, { command: 'build', mode: 'production' })).toBe(
          false
        );
      } else {
        expect(plugin.apply).toBe('serve');
      }
    });

    it('should have configureServer hook', () => {
      expect(plugin.configureServer).toBeDefined();
      expect(typeof plugin.configureServer).toBe('function');
    });

    it('should have transform hook', () => {
      expect(plugin.transform).toBeDefined();
      expect(typeof plugin.transform).toBe('function');
    });
  });

  describe('Server Configuration', () => {
    it('should register WebSocket message handler', () => {
      const configureServer = plugin.configureServer;
      if (configureServer && typeof configureServer === 'function') {
        configureServer(mockServer as ViteDevServer);
        expect(mockWs.on).toHaveBeenCalledWith(
          'vibegame:console',
          expect.any(Function)
        );
      }
    });

    it('should handle console messages from client', () => {
      const consoleSpy = mock(() => {});
      global.console.log = consoleSpy;

      const configureServer = plugin.configureServer;
      if (configureServer && typeof configureServer === 'function') {
        configureServer(mockServer as ViteDevServer);
        const calls = (mockWs.on as any).mock.calls || [];
        const handler = calls.find(
          (call: any[]) => call && call[0] === 'vibegame:console'
        )?.[1];

        if (handler) {
          handler({
            level: 'info',
            message: 'Test message',
            timestamp: Date.now(),
            context: { file: 'test.ts', line: 10 },
          });

          expect(consoleSpy).toHaveBeenCalled();
        }
      }
    });

    it('should format messages with context', () => {
      const consoleSpy = mock(() => {});
      global.console.error = consoleSpy;

      const configureServer = plugin.configureServer;
      if (configureServer && typeof configureServer === 'function') {
        configureServer(mockServer as ViteDevServer);
        const calls = (mockWs.on as any).mock.calls || [];
        const handler = calls.find(
          (call: any[]) => call && call[0] === 'vibegame:console'
        )?.[1];

        if (handler) {
          handler({
            level: 'error',
            message: 'Error occurred',
            timestamp: Date.now(),
            context: {
              file: 'src/component.ts',
              line: 42,
              stack: 'Error: Test\n    at function1 (file.ts:10:5)',
            },
          });

          expect(consoleSpy).toHaveBeenCalled();
          const calls: any[] = consoleSpy.mock.calls || [];
          const output = calls.length > 0 ? calls[0][0] : undefined;
          expect(output).toContain('[ERROR]');
          expect(output).toContain('src/component.ts:42');
        }
      }
    });
  });

  describe('Client Code Injection', () => {
    it('should inject console override script into main.ts', () => {
      const code = 'console.log("original code");';
      const id = '/src/main.ts';

      const transform = plugin.transform;
      if (transform && typeof transform === 'function') {
        const result = transform.call({} as any, code, id);
        const transformedCode = typeof result === 'string' ? result : result;

        expect(transformedCode).toContain('import.meta.hot');
        expect(transformedCode).toContain('originalConsole');
        expect(transformedCode).toContain('console');
        expect(transformedCode).toContain('original code');
      }
    });

    it('should include all console methods in override', () => {
      const code = 'console.log("test");';
      const id = '/src/main.js';

      const transform = plugin.transform;
      if (transform && typeof transform === 'function') {
        const result = transform.call({} as any, code, id);
        const transformedCode = typeof result === 'string' ? result : result;

        expect(transformedCode).toContain('log');
        expect(transformedCode).toContain('warn');
        expect(transformedCode).toContain('error');
        expect(transformedCode).toContain('debug');
      }
    });

    it('should capture stack traces', () => {
      const code = 'const app = createApp();';
      const id = '/project/src/main.ts';

      const transform = plugin.transform;
      if (transform && typeof transform === 'function') {
        const result = transform.call({} as any, code, id);
        const transformedCode = typeof result === 'string' ? result : result;

        expect(transformedCode).toContain('Error().stack');
        expect(transformedCode).toContain('getStackInfo');
      }
    });

    it('should send messages via WebSocket', () => {
      const code = 'export default {}';
      const id = '/src/main.ts';

      const transform = plugin.transform;
      if (transform && typeof transform === 'function') {
        const result = transform.call({} as any, code, id);
        const transformedCode = typeof result === 'string' ? result : result;

        expect(transformedCode).toContain('import.meta.hot.send');
        expect(transformedCode).toContain('vibegame:console');
      }
    });

    it('should not transform non-main files', () => {
      const code = 'console.log("component code");';
      const id = '/src/components/Button.ts';

      const transform = plugin.transform;
      if (transform && typeof transform === 'function') {
        const result = transform.call({} as any, code, id);

        expect(result).toBe(code);
      }
    });
  });

  describe('Message Formatting', () => {
    it('should handle different log levels', () => {
      const levels = ['debug', 'info', 'warn', 'error'];
      const spies: Record<string, any> = {};

      levels.forEach((level) => {
        spies[level] = mock(() => {});
        (global.console as any)[level === 'info' ? 'log' : level] =
          spies[level];
      });

      const configureServer = plugin.configureServer;
      if (configureServer && typeof configureServer === 'function') {
        configureServer(mockServer as ViteDevServer);
        const calls = (mockWs.on as any).mock.calls || [];
        const handler = calls.find(
          (call: any[]) => call && call[0] === 'vibegame:console'
        )?.[1];

        if (handler) {
          levels.forEach((level) => {
            handler({
              level,
              message: `${level} message`,
              timestamp: Date.now(),
              context: {},
            });

            const spy = spies[level === 'info' ? level : level];
            expect(spy).toHaveBeenCalled();
          });
        }
      }
    });

    it('should handle multiple arguments', () => {
      const consoleSpy = mock(() => {});
      global.console.log = consoleSpy;

      const configureServer = plugin.configureServer;
      if (configureServer && typeof configureServer === 'function') {
        configureServer(mockServer as ViteDevServer);
        const calls = (mockWs.on as any).mock.calls || [];
        const handler = calls.find(
          (call: any[]) => call && call[0] === 'vibegame:console'
        )?.[1];

        if (handler) {
          handler({
            level: 'info',
            message: 'Multiple args',
            args: ['arg1', 42, { key: 'value' }],
            timestamp: Date.now(),
            context: {},
          });

          expect(consoleSpy).toHaveBeenCalled();
          const calls: any[] = consoleSpy.mock.calls || [];
          const output = calls.length > 0 ? calls[0][0] : undefined;
          expect(output).toContain('arg1');
          expect(output).toContain('42');
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle malformed messages', () => {
      const consoleSpy = mock(() => {});
      global.console.error = consoleSpy;

      const configureServer = plugin.configureServer;
      if (configureServer && typeof configureServer === 'function') {
        configureServer(mockServer as ViteDevServer);
        const calls = (mockWs.on as any).mock.calls || [];
        const handler = calls.find(
          (call: any[]) => call && call[0] === 'vibegame:console'
        )?.[1];

        if (handler) {
          expect(() => {
            handler(null);
            handler(undefined);
            handler({});
            handler({ level: 'invalid' });
          }).not.toThrow();
        }
      }
    });

    it('should handle circular references in arguments', () => {
      const consoleSpy = mock(() => {});
      global.console.log = consoleSpy;

      const configureServer = plugin.configureServer;
      if (configureServer && typeof configureServer === 'function') {
        configureServer(mockServer as ViteDevServer);
        const calls = (mockWs.on as any).mock.calls || [];
        const handler = calls.find(
          (call: any[]) => call && call[0] === 'vibegame:console'
        )?.[1];

        if (handler) {
          const circular: any = { a: 1 };
          circular.self = circular;

          expect(() => {
            handler({
              level: 'info',
              message: 'Circular reference',
              args: [circular],
              timestamp: Date.now(),
              context: {},
            });
          }).not.toThrow();
        }
      }
    });
  });
});
