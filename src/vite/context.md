# Vite Plugin Module

Vite plugins for VibeGame development and build tooling.

## Structure

- **index.ts** - Plugin exports
- **console-plugin.ts** - Console forwarding for development

## Plugins

### vibegame()
WASM configuration plugin that aliases Rapier3D to the compatible version.

### consoleForwarding()
Development plugin that forwards browser console output to terminal:
- Injects console override into main.ts via transform hook
- Captures console.log, warn, error, debug methods
- Extracts file/line context from stack traces
- Formats output with timestamps and ANSI color codes
- Uses Vite's HMR WebSocket for message transport
- Only active in serve mode with enforce: 'post'

## Usage

```typescript
import { defineConfig } from 'vite';
import { vibegame, consoleForwarding } from 'vibegame/vite';

export default defineConfig({
  plugins: [vibegame(), consoleForwarding()]
});
```

## Implementation

Console forwarding works by:
1. Transforming the main entry file to inject console overrides
2. Using `import.meta.hot.send()` to transmit messages
3. Server-side WebSocket listener formats and outputs to terminal
4. Preserves original console behavior in browser