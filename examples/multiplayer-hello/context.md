# Multiplayer Hello Example

<!-- LLM:OVERVIEW -->
Hybrid multiplayer demonstration. Server runs authoritative physics for server-owned entities, clients control player with client-authority. Showcases automatic networking integration with the engine.
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

- Hybrid architecture (server-authoritative by default, client-authority for player)
- Automatic player client-authority via NetworkingPlugin
- Server ECS with physics simulation
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

- Server-authoritative ECS with physics simulation
- Parses world XML from index.html to create server-owned entities
- Simulates server-owned entities (e.g., world objects) with full physics
- Relays client-authority entities (e.g., players)
- Minimal server code (4 lines)

```typescript
import { createGameServer } from 'vibegame/server';

createGameServer({
  port: 2567,
  worldFile: './index.html'  // Parses same world as client
});
```

## Current State

- ✅ Hybrid model with server-authoritative physics
- ✅ Server parses world XML and creates server-authoritative entities
- ✅ Client-authority for player entities
- ✅ Server-owned world entities simulated authoritatively
- ✅ Position broadcasting via Colyseus schemas
- ✅ Remote entities rendered as kinematic ghosts
- ✅ Offline mode support
- ✅ "Invisible" networking - same world definition for client and server

<!-- LLM:EXAMPLES -->
## Examples

### Testing Offline Mode

Set `ONLINE_MODE = false` in client.ts, run `bun run dev`

### Testing Online Mode

Set `ONLINE_MODE = true` in client.ts, start server, then client
<!-- /LLM:EXAMPLES -->
