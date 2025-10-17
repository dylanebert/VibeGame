# Networking Plugin

<!-- LLM:OVERVIEW -->
Client-side Colyseus networking. Auto-connects to ws://localhost:2567 and handles message routing.
<!-- /LLM:OVERVIEW -->

## Purpose

- Auto-connect to Colyseus server
- Setup message handlers for networked games

## Layout

```
networking/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
└── systems.ts  # Connection system
```

## Scope

- **In-scope**: Client connection, basic message routing
- **Out-of-scope**: Server implementation, state synchronization, ownership transfer

## Entry Points

- **NetworkingPlugin**: Plugin with connection system

## Dependencies

- **Internal**: Core ECS types, State
- **External**: colyseus.js

<!-- LLM:REFERENCE -->
## API Reference

### Systems

**NetworkConnectionSystem**
- Group: setup
- First: true
- Auto-connects to ws://localhost:2567 if no room exists
- Joins or creates 'game' room
- Sets up message handlers

<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Usage

```typescript
import * as GAME from 'vibegame';

GAME.run();
```

This will auto-connect to ws://localhost:2567 when NetworkingPlugin is included.
<!-- /LLM:EXAMPLES -->
