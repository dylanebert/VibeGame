import type { Plugin, ViteDevServer } from 'vite';
import { formatLogMessage, type LogMessage } from '../core/utils/logger';

export function consoleForwarding(): Plugin {
  let server: ViteDevServer;

  return {
    name: 'vibegame:console-forwarding',
    apply: 'serve',
    enforce: 'post',

    configureServer(_server: ViteDevServer) {
      server = _server;

      server.ws.on('vibegame:console', (data: LogMessage) => {
        try {
          if (!data || !data.level) return;

          if (!data.timestamp || isNaN(data.timestamp)) {
            data.timestamp = Date.now();
          }

          if (!data.context) {
            data.context = {};
          }

          const formatted = formatLogMessage(data);

          switch (data.level) {
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
            default:
              console.log(formatted);
          }
        } catch (error) {
          console.error('[VibeGame] Error processing console message:', error);
        }
      });

      server.ws.on('connection', () => {
        setTimeout(() => {
          server.ws.send({
            type: 'custom',
            event: 'vibegame:init-console-forwarding',
          });
        }, 100);
      });
    },

    transform(code: string, id: string) {
      if (id.includes('/src/main.ts') || id.includes('/src/main.js')) {
        const injection = `
if (import.meta.hot) {
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  };
  
  function getStackInfo() {
    const stack = new Error().stack;
    if (!stack) return {};
    
    const lines = stack.split('\\n');
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('console-override')) continue;
      
      const match = line.match(/at\\s+.*?\\s+\\(?(.*?):(\\d+):(\\d+)\\)?/);
      if (match) {
        return {
          file: match[1].replace(window.location.origin, ''),
          line: parseInt(match[2], 10),
        };
      }
    }
    return {};
  }
  
  function sendConsoleMessage(level, args) {
    const stackInfo = getStackInfo();
    const message = {
      level,
      message: args[0]?.toString() || '',
      args: args.length > 1 ? Array.from(args).slice(1) : undefined,
      timestamp: Date.now(),
      context: {
        ...stackInfo,
      },
    };
    
    if (args[0] instanceof Error) {
      message.context.stack = args[0].stack;
    }
    
    import.meta.hot.send('vibegame:console', message);
  }
  
  ['log', 'warn', 'error', 'debug'].forEach(method => {
    console[method] = function(...args) {
      // Suppress known Rapier initialization warning
      if (method === 'warn' && args[0]?.toString().includes('using deprecated parameters for the initialization function')) {
        return;
      }
      originalConsole[method](...args);
      sendConsoleMessage(method === 'log' ? 'info' : method, args);
    };
  });
  
  console.log('[VibeGame] Console forwarding enabled');
}
`;
        return injection + '\n' + code;
      }
      return code;
    },
  };
}
