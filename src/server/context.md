# Server Runtime

<!-- LLM:OVERVIEW -->
Pure Colyseus relay server with no ECS or physics simulation. Receives position snapshots from clients, validates them, and broadcasts to other clients. Generic body abstraction with no player-specific logic.
<!-- /LLM:OVERVIEW -->

## Architecture

**Pure Relay Model:**
- NO ECS State
- NO Physics simulation
- NO game loop
- Just Colyseus state synchronization

**Responsibilities:**
- Accept client connections
- Receive position snapshots, stamp with tick number
- Validate snapshots (bounds, NaN/Infinity)
- Broadcast to other clients via Colyseus auto-sync

## Layout

```
server/
├── context.md
├── schemas.ts      # BodyState, GameState (Colyseus schemas)
├── game-room.ts    # Room lifecycle and message handlers
├── utils.ts        # Validation and sanitization
└── index.ts        # createGameServer() API
```

## Scope

- Connection lifecycle (join/leave)
- Position message handling for networked bodies
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
- `onJoin(client)` - Create body state for client session
- `onLeave(client)` - Remove body state for client session
- `onDispose()` - Cleanup

### Schemas
- `BodyState` - Position, rotation, and tick (pos, rot, tick)
- `GameState` - MapSchema of bodies, serverTick counter

### Validation
- `isValidSnapshot(snapshot)` - Bounds and NaN checks
- `sanitizeNumber(value)` - NaN/Infinity protection
- `normalizeQuaternion(quat)` - Unit quaternion enforcement
<!-- /LLM:REFERENCE -->
