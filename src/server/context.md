# Server Runtime

<!-- LLM:OVERVIEW -->
Pure Colyseus relay server with no ECS or physics simulation. Receives structural updates and position snapshots with entity IDs, validates them, and broadcasts to other clients via MapSchema. Supports multiple entities per session using composite keys.
<!-- /LLM:OVERVIEW -->

## Architecture

**Pure Relay Model:**
- NO ECS State
- NO Physics simulation
- NO game loop
- Just Colyseus state synchronization

**Responsibilities:**
- Accept client connections
- Receive structural updates (component data) and position snapshots with entity IDs
- Stamp position updates with tick number
- Map state by composite key (sessionId:entityId) for multi-entity sessions
- Validate snapshots (bounds, NaN/Infinity)
- Broadcast to other clients via Colyseus MapSchema auto-sync
- Clean up all session entities on disconnect

## Layout

```
server/
├── context.md
├── composite-key.ts # Composite key helpers (internal)
├── schemas.ts       # BodyState, GameState (Colyseus schemas)
├── game-room.ts     # Room lifecycle and message handlers
├── utils.ts         # Validation and sanitization
└── index.ts         # createGameServer() API
```

## Scope

- Connection lifecycle (join/leave)
- Structural update message handling (component data)
- Position message handling with entity IDs
- Composite key management for multi-entity sessions
- Basic anti-cheat validation
- State broadcasting via MapSchema (automatic via Colyseus)

## Entry Points

- `createGameServer(options)` - Creates and starts Colyseus server
- `GameRoom` - Room class handling connections and messages

<!-- LLM:REFERENCE -->
## API Reference

### createGameServer(options)
- `port?: number` - Server port (default: 2567)
- Returns: Colyseus `Server` instance

### GameRoom
- `onCreate()` - Initialize room and register message handlers
- `onJoin(client)` - Client connection
- `onLeave(client)` - Remove all bodies and structures for session using prefix match
- `onDispose()` - Cleanup

### Schemas
- `BodyState` - Position, rotation, tick
- `StructuralState` - Serialized component data
- `GameState` - MapSchemas for bodies and structures, keyed by "sessionId:entityId"
- `PositionSnapshot` - Client message type with entity ID

### Validation
- `isValidSnapshot(snapshot)` - Bounds and NaN checks
- `sanitizeNumber(value)` - NaN/Infinity protection
- `normalizeQuaternion(quat)` - Unit quaternion enforcement
<!-- /LLM:REFERENCE -->
