# Multiplayer Hello Example

<!-- LLM:OVERVIEW -->
Client-instance multiplayer demonstration. Each client runs full physics simulation, server is pure relay. Showcases automatic networking integration with the engine.
<!-- /LLM:OVERVIEW -->

## Layout

```
multiplayer-hello/
├── context.md
├── src/
│   ├── client.ts  # Client with NetworkingPlugin
│   └── server.ts  # Pure relay server
├── package.json
└── vite.config.ts
```

## Scope

- Client-instance architecture (full local physics)
- Automatic player ownership via NetworkingPlugin
- Pure relay server (no ECS, no physics)
- Offline/online mode toggle

## Running

**Terminal 1:** `bun run server` (Colyseus server on port 2567)
**Terminal 2:** `bun run dev` (client dev server)
**Browser:** Open displayed URL
**Monitor:** http://localhost:2567/colyseus

## Architecture

### Client (client.ts)

- Runs ECS State with NetworkingPlugin
- Player auto-created by StartupPlugin
- Player auto-marked as Owned when connected
- Full physics simulation locally

```typescript
const runtime = await GAME.withPlugin(NetworkingPlugin).run();
const state = runtime.getState();

// Connect to server
const client = new Colyseus.Client('ws://localhost:2567');
const room = await client.joinOrCreate('game');

// Store room in network state
const netState = getNetworkState(state);
netState.room = room;

// That's it! Player auto-created and auto-owned
```

### Server (server.ts)

- Pure Colyseus relay (no ECS, no physics)
- Receives position snapshots
- Validates and broadcasts to clients
- Minimal server code (3 lines)

```typescript
import { createGameServer } from 'vibegame/server';

createGameServer({ port: 2567 });
```

## Current State

- ✅ Client-instance model with automatic ownership
- ✅ Pure relay server (no simulation)
- ✅ Position broadcasting via Colyseus schemas
- ✅ Remote players rendered as kinematic ghosts
- ✅ Offline mode support

<!-- LLM:EXAMPLES -->
## Examples

### Testing Offline Mode

Set `ONLINE_MODE = false` in client.ts, run `bun run dev`

### Testing Online Mode

Set `ONLINE_MODE = true` in client.ts, start server, then client
<!-- /LLM:EXAMPLES -->
