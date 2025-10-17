# Server Module

Server-side runtime for multiplayer networking with Colyseus.

## Purpose

- Simplified server setup (Roblox-style workflow)
- Colyseus integration handled internally
- Server-authoritative ECS game loop

## Layout

```
server/
├── context.md  # This file
├── builder.ts  # ServerBuilder class
├── room.ts     # GameRoom Colyseus room
└── index.ts    # Server exports and global API
```

## Usage

### Zero-Config Server

```typescript
import * as SERVER from 'vibegame/server';

SERVER.run();
```

### With Plugins

```typescript
import * as SERVER from 'vibegame/server';

SERVER.createServer()
  .withPlugin(MyGamePlugin)
  .run();
```

### With Configuration

```typescript
import * as SERVER from 'vibegame/server';

SERVER.run({
  port: 3000,
  tickRate: 60
});
```

## Key Concepts

- **ServerBuilder**: Fluent builder API (mirrors GameBuilder)
- **GameRoom**: Colyseus room with integrated ECS State
- **Global API**: Zero-config functions for simple use cases
- **Internal Handling**: Colyseus, WebSocket transport setup hidden from users
