# Server Runtime

<!-- LLM:OVERVIEW -->
Pure Colyseus relay server with no ECS or physics simulation. Receives position snapshots with entity IDs, validates them, and broadcasts to other clients. Supports multiple entities per session using composite keys.
<!-- /LLM:OVERVIEW -->

## Architecture

**Pure Relay Model:**
- NO ECS State
- NO Physics simulation
- NO game loop
- Just Colyseus state synchronization

**Responsibilities:**
- Accept client connections
- Receive position snapshots with entity IDs, stamp with tick number
- Map bodies by composite key (sessionId:entityId) for multi-entity sessions
- Validate snapshots (bounds, NaN/Infinity)
- Broadcast to other clients via Colyseus auto-sync

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
- Position message handling with entity IDs
- Composite key management for multi-entity sessions
- Basic anti-cheat validation
- State broadcasting (automatic via Colyseus)

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
- `onJoin(client)` - Client connection (entities created on first position update)
- `onLeave(client)` - Remove all entities for session using prefix match
- `onDispose()` - Cleanup

### Schemas
- `BodyState` - Position, rotation, tick
- `GameState` - MapSchema of bodies keyed by "sessionId:entityId"
- `PositionSnapshot` - Client message type with entity ID

### Validation
- `isValidSnapshot(snapshot)` - Bounds and NaN checks
- `sanitizeNumber(value)` - NaN/Infinity protection
- `normalizeQuaternion(quat)` - Unit quaternion enforcement
<!-- /LLM:REFERENCE -->
