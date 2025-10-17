# Multiplayer Example

Simple multiplayer networking example using Colyseus.

## Quick Start

**Terminal 1 - Run Server:**
```bash
bun src/server.ts
```

**Terminal 2 - Run Client:**
```bash
bun run dev
```

**Terminal 3 - Test Connection (optional):**
```bash
bun test-connection.ts
```

## Server Code

The server setup is intentionally minimal:

```typescript
import * as SERVER from 'vibegame/server';

SERVER.run();
```

All heavy lifting (Colyseus setup, WebSocket configuration, etc.) is handled internally by `vibegame/server`.

## Adding Game Logic

Use the builder pattern to add plugins and systems:

```typescript
import * as SERVER from 'vibegame/server';
import { MyGamePlugin } from './my-game-plugin';

SERVER.createServer()
  .withPlugin(MyGamePlugin)
  .run();
```

## Configuration

Customize port and tick rate:

```typescript
import * as SERVER from 'vibegame/server';

SERVER.run({
  port: 3000,
  tickRate: 60
});
```
