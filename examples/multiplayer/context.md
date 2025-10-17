# Multiplayer Example

<!-- LLM:OVERVIEW -->
Multiplayer networking example demonstrating Colyseus server integration with VibeGame client. Shows server-authoritative ECS with client connection handling.
<!-- /LLM:OVERVIEW -->

## Purpose

- Demonstrate Colyseus server integration
- Show client-server synchronization
- Test multiplayer capabilities
- Provide networking reference

## Layout

```
multiplayer/
├── context.md  # This file
├── src/
│   ├── main.ts  # Client entry point
│   └── server.ts  # Server entry point
├── test-connection.ts  # Connection test script
├── index.html  # HTML entry point
├── package.json  # Example dependencies
└── vite.config.ts  # Vite configuration
```

## Scope

- **In-scope**: Client-server networking, Colyseus integration
- **Out-of-scope**: Production deployment, scalability

## Entry Points

- **src/server.ts**: Server entry point (Colyseus server with VibeGame)
- **src/main.ts**: Client entry point (browser client)
- **test-connection.ts**: Connection test script

## Dependencies

- **Internal**: Full engine, server module
- **External**: Colyseus, colyseus.js, Vite

## Features Demonstrated

- Zero-config server setup
- Client connection to server
- Server-authoritative ECS
- Client-server state synchronization

## Running

```bash
# Terminal 1: Start server
cd examples/multiplayer
bun src/server.ts

# Terminal 2: Start client
cd examples/multiplayer
bun run dev

# Terminal 3: Test connection
cd examples/multiplayer
bun run test
```

<!-- LLM:EXAMPLES -->
## Examples

### Server Setup

```typescript
// src/server.ts
import * as SERVER from 'vibegame/server';

SERVER.run();
```

### Client Setup

```typescript
// src/main.ts
import * as GAME from 'vibegame';

GAME.configure({
  serverUrl: 'ws://localhost:2567',
}).run();
```

Or using environment variable (VITE_SERVER_URL):

```typescript
// src/main.ts
import * as GAME from 'vibegame';

GAME.run();
```

### Testing Connection

```typescript
// test-connection.ts
import { Client } from 'colyseus.js';

const client = new Client('ws://localhost:2567');
const room = await client.joinOrCreate('game');
console.log('Connected to room:', room.id);
await room.leave();
```
<!-- /LLM:EXAMPLES -->
