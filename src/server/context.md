# Server Runtime

<!-- LLM:OVERVIEW -->
Server-authoritative Colyseus server with emergent state synchronization. Server spawns world entities on room creation. Runs server-side ECS with physics for server-owned entities, relays client-owned positions.
<!-- /LLM:OVERVIEW -->

## Architecture

**Room Initialization:**
- Room starts immediately with active state
- Server parses world XML and spawns entities on `onCreate()` if worldXML/worldFile provided
- All server-created entities automatically marked with ServerAuthority
- All clients observe same state continuously
- No special initialization protocol needed

**Authority Model:**
- Server-owned (default): Server simulates physics, broadcasts to clients
- Client-owned (ClientAuthority): Client simulates, server relays positions

**Responsibilities:**
- Parse world XML (from worldXML or worldFile option) and spawn entities on room creation
- Assign globally unique network IDs to all entities
- Run server-side ECS with physics at 50Hz for server entities
- Relay client-owned entity positions
- Stamp position updates with tick number
- Validate snapshots (bounds, NaN/Infinity)
- Broadcast via Colyseus MapSchema auto-sync
- Cleanup on disconnect (client entities removed, server entities persist)

## Layout

```
server/
├── context.md
├── schemas.ts       # BodyState, GameState (Colyseus schemas)
├── game-room.ts     # Room lifecycle, network ID allocation, message handlers
├── plugins.ts       # Server plugin bundle with componentsOnly() helper
├── utils.ts         # Validation, sanitization, entity serialization
└── index.ts         # createGameServer() API
```

## Scope

- XML parsing and world entity spawning on room creation
- DOMParser setup for server environment (jsdom)
- Connection lifecycle (join/leave)
- Network ID allocation and assignment
- Server entity marking (NetworkIdentity + ServerAuthority)
- Client-owned entity relay
- Position message handling with network IDs
- Entity ownership tracking ('server' or sessionId)
- Validation (bounds, NaN checks)
- State broadcasting via MapSchema

## Entry Points

- `createGameServer(options)` - Creates and starts Colyseus server
- `GameRoom` - Room class handling connections and messages
- `ServerPlugins` - Server plugin bundle:
  - PhysicsPlugin (full with systems for server-side physics)
  - TransformsPlugin (full with systems for hierarchy)
  - RenderingPlugin (components only, no rendering systems)
  - AnimationPlugin (components only, no animation systems)
- `componentsOnly(plugin)` - Strips systems from plugin, keeping only components/config

<!-- LLM:REFERENCE -->
## API Reference

### createGameServer(options)
- `port?: number` - Server port (default: 2567)
- `worldXML?: string` - XML string to parse for initial world state
- `worldFile?: string` - Path to HTML/XML file to load world from
- Returns: Colyseus `Server` instance

### GameRoom
- `onCreate(options)` - Initialize server ECS, physics, parse world XML, spawn world entities
- `onJoin(client)` - Log connection
- `onLeave(client)` - Remove client-owned entities
- `onDispose()` - Cleanup server state
- `spawnServerEntity(components)` - Create server-authoritative entity
- `initializeWorld(worldXML)` - Parse XML and create server entities (private)
- `markAsServerEntity(entity)` - Mark entity with ServerAuthority and NetworkIdentity (private)
- Message: `'request-network-id'` - Assigns unique network ID
- Message: `'position'` - Relay client-owned positions
- Message: `'structural'` - Relay client-owned structural updates

### GameRoomOptions
- `worldXML?: string` - XML string for initial world state

### Schemas
- `GameState` - bodies, structures
- `BodyState` - networkId, owner, position, rotation, tick, grounded
- `StructuralState` - networkId, owner, serialized component data

### Validation
- `isValidSnapshot(snapshot)` - Bounds and NaN checks
- `sanitizeNumber(value)` - NaN/Infinity protection
- `normalizeQuaternion(quat)` - Unit quaternion enforcement
- `serializeEntityComponents(entity, state)` - Serialize networked components for entity

### Server Plugin Pattern

The server uses a **components-only** pattern for visual plugins:

```typescript
function componentsOnly(plugin: Plugin): Plugin {
  return {
    components: plugin.components,
    recipes: plugin.recipes,
    config: plugin.config,
    networked: plugin.networked,
  };
}
```

**Why?**
- Components are lightweight (just typed arrays)
- Systems consume CPU (rendering, postprocessing, etc.)
- Server needs component definitions for XML parsing and serialization
- Server doesn't need to run visual simulation

**Result:**
- XML parsing works (components exist in registry)
- Structural data serialized and networked to clients
- No wasted CPU on rendering/visual systems
<!-- /LLM:REFERENCE -->
