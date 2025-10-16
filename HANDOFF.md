# Multiplayer Networking - Roblox-Style Architecture

**Goal:** Server-authoritative multiplayer with automatic client simulation transfer, zero configuration for simple games.

**Philosophy:** Entities persist across ownership changes. Server controls entity lifecycle. Clients smoothly transition between simulating and interpolating.

---

## Core Principles

1. **Context-aware defaults** - Server creates = networked, Client creates = local
2. **Entities persist** - Ownership changes without destroy/create
3. **Auto-transfer** - Server delegates simulation to nearby clients automatically
4. **Simple client** - Clients don't track transfer history, just current owner
5. **Server authority** - Server controls lifecycle, can reclaim entities

---

## Component Architecture

### Authoring Component (Ephemeral)

```typescript
// src/core/xml/components.ts
export const Networking = defineComponent({
  mode: Types.ui8  // 0=auto, 1=owned
});
```

**Used in XML, removed at runtime:**
```xml
<!-- Server: Auto (default): server-owned, auto-transferable -->
<dynamic-part pos="0 5 0"></dynamic-part>

<!-- Server: Owned: server-owned, never transfers -->
<dynamic-part networking="owned" pos="0 5 0"></dynamic-part>

<!-- Client: Auto (default): client-only, never sent to server -->
<dynamic-part pos="0 5 0"></dynamic-part>

<!-- Client: Owned: client-owned, broadcast to server -->
<dynamic-part networking="owned" pos="0 5 0"></dynamic-part>
```

### Runtime Components

```typescript
// src/plugins/networking/components.ts

// Core: Who owns this entity?
export const NetworkOwner = defineComponent({
  owner: Types.ui32  // 0=server, >0=clientId
});

// Tag: Don't auto-transfer (server-only)
export const NetworkLock = defineComponent({});

// Tag: Never networked (client optimization)
export const LocalOnly = defineComponent({});
```

**That's it.** Three runtime components total.

---

## Ownership Modes

### 1. Auto (Default for Server)

**XML:**
```xml
<dynamic-part pos="0 5 0"></dynamic-part>
```

**Runtime (Server):**
- `NetworkOwner(owner=0)` initially
- No `NetworkLock`
- AutoTransferPlugin can transfer to nearby clients

**Runtime (Client A when nearby):**
- Receives: `{ type: 'ownership', entity: 42, owner: clientA }`
- `NetworkOwner(owner=clientA)` updates
- Client A simulates, others interpolate

**Runtime (Client A when far):**
- Receives: `{ type: 'ownership', entity: 42, owner: 0 }`
- `NetworkOwner(owner=0)` updates
- Client A interpolates from server

### 2. Server-Only (Explicit Lock)

**XML:**
```xml
<dynamic-part networking="server" pos="0 5 0"></dynamic-part>
```

**Runtime (Server):**
- `NetworkOwner(owner=0)`
- `NetworkLock` (prevents transfer)

**Runtime (All Clients):**
- `NetworkOwner(owner=0)`
- Always interpolate from server

### 3. Client-Owned (Player)

**Server code on join:**
```typescript
const player = state.createFromRecipe('player');
state.addComponent(player, NetworkOwner, { owner: client.id });
state.addComponent(player, NetworkLock);
```

**Runtime (Owner Client):**
- `NetworkOwner(owner=myId)`
- `NetworkLock`
- Simulate and broadcast

**Runtime (Other Clients):**
- `NetworkOwner(owner=otherClientId)`
- Interpolate from server-relayed updates

### 4. Local-Only (Client Default)

**Client code:**
```typescript
const particle = state.createEntity();
state.addComponent(particle, Renderer);
// No networking specified
```

**Runtime (Client):**
- `LocalOnly` tag
- No `NetworkOwner`
- Simulate locally, never sent to server

**Runtime (Server):**
- Entity doesn't exist

---

## State Context Awareness

```typescript
// src/core/ecs/state.ts
export type StateContext = 'server' | 'client';

export interface StateOptions {
  context?: StateContext;
  clientId?: number;
  room?: ColyseusRoom;  // For client
}

export class State {
  public readonly context: StateContext;
  public readonly clientId?: number;
  public readonly room?: ColyseusRoom;

  constructor(options: StateOptions = {}) {
    this.context = options.context ?? 'client';
    this.clientId = options.clientId;
    this.room = options.room;
    // ...
  }

  isServer(): boolean { return this.context === 'server'; }
  isClient(): boolean { return this.context === 'client'; }

  createEntity(): number {
    const entity = this.world.addEntity();

    // Context-aware defaults
    if (this.context === 'server') {
      // Server entities networked by default
      this.addComponent(entity, NetworkOwner, { owner: 0 });
    } else {
      // Client entities local by default
      this.addComponent(entity, LocalOnly);
    }

    return entity;
  }

  // Override for explicit networking
  createNetworkedEntity(owner: number): number {
    const entity = this.world.addEntity();
    this.addComponent(entity, NetworkOwner, { owner });
    return entity;
  }
}
```

---

## Networking Plugin

### Component Conversion System

```typescript
// src/plugins/networking/systems.ts
export const NetworkingInitSystem: System = {
  group: 'setup',
  first: true,
  update: (state) => {
    const query = defineQuery([Networking]);

    for (const entity of query(state.world)) {
      const mode = Networking.mode[entity];

      if (state.isServer()) {
        // Server processes authoring config
        if (mode === NetworkMode.Auto || mode === NetworkMode.Server) {
          state.addComponent(entity, NetworkOwner, { owner: 0 });

          if (mode === NetworkMode.Server) {
            state.addComponent(entity, NetworkLock);
          }
        }
        // Client mode: handled during player spawn
      } else {
        // Client processes authoring config
        if (mode === NetworkMode.Client) {
          // Client-broadcast entity
          state.addComponent(entity, NetworkOwner, { owner: state.clientId! });

          // Request server to spawn
          state.room!.send('request-spawn', {
            tempId: entity,
            components: serializeComponents(entity)
          });
        }
        // Auto/Server modes: spawned by server, handled in spawn messages
      }

      // Remove ephemeral authoring component
      state.removeComponent(entity, Networking);
    }
  }
};
```

### Client Systems

```typescript
// Send updates for owned entities
export const ClientSendSystem: System = {
  group: 'fixed',
  last: true,
  update: (state) => {
    if (!state.isClient()) return;

    const query = defineQuery([NetworkOwner, Transform]);
    const updates: EntityUpdate[] = [];

    for (const entity of query(state.world)) {
      if (NetworkOwner.owner[entity] !== state.clientId) continue;

      updates.push({
        entity,
        components: {
          [Transform.id]: {
            posX: Transform.posX[entity],
            posY: Transform.posY[entity],
            posZ: Transform.posZ[entity],
            rotX: Transform.rotX[entity],
            rotY: Transform.rotY[entity],
            rotZ: Transform.rotZ[entity],
            rotW: Transform.rotW[entity]
          }
        }
      });
    }

    if (updates.length > 0) {
      state.room!.send('entity:update', updates);
    }
  }
};

// Interpolate remote entities
export const ClientInterpolationSystem: System = {
  group: 'simulation',
  update: (state) => {
    if (!state.isClient()) return;

    const query = defineQuery([NetworkOwner, Transform, NetworkState]);

    for (const entity of query(state.world)) {
      // Skip entities I own
      if (NetworkOwner.owner[entity] === state.clientId) continue;

      // Interpolate toward target state
      const alpha = 0.2;
      Transform.posX[entity] = lerp(
        Transform.posX[entity],
        NetworkState.targetPosX[entity],
        alpha
      );
      Transform.posY[entity] = lerp(
        Transform.posY[entity],
        NetworkState.targetPosY[entity],
        alpha
      );
      Transform.posZ[entity] = lerp(
        Transform.posZ[entity],
        NetworkState.targetPosZ[entity],
        alpha
      );
      // ... rotation, etc.
    }
  }
};

// Handle messages from server
export const ClientMessageSystem: System = {
  group: 'setup',
  first: true,
  update: (state) => {
    if (!state.isClient()) return;

    // Process queued messages from Colyseus
    for (const msg of getQueuedMessages(state)) {
      switch (msg.type) {
        case 'spawn':
          handleSpawn(state, msg);
          break;
        case 'destroy':
          handleDestroy(state, msg);
          break;
        case 'ownership':
          // KEY: Just update owner, entity persists
          NetworkOwner.owner[msg.entity] = msg.owner;
          break;
        case 'update':
          handleUpdate(state, msg);
          break;
      }
    }
  }
};
```

### Server Systems

```typescript
// Simulate server-owned entities
export const ServerSimulationSystem: System = {
  group: 'fixed',
  update: (state) => {
    if (!state.isServer()) return;

    const query = defineQuery([NetworkOwner, Body]);

    for (const entity of query(state.world)) {
      if (NetworkOwner.owner[entity] !== 0) continue;

      // Server simulates its own entities
      // Physics runs normally
    }
  }
};

// Broadcast updates to all clients
export const ServerBroadcastSystem: System = {
  group: 'fixed',
  last: true,
  update: (state) => {
    if (!state.isServer()) return;

    const query = defineQuery([NetworkOwner, Transform]);
    const updates: EntityUpdate[] = [];

    for (const entity of query(state.world)) {
      updates.push({
        entity,
        owner: NetworkOwner.owner[entity],
        components: serializeComponents(entity, [Transform, Body])
      });
    }

    if (updates.length > 0) {
      broadcastToAllClients('entity:update', updates);
    }
  }
};

// Receive client updates
export const ServerReceiveSystem: System = {
  group: 'setup',
  first: true,
  update: (state) => {
    if (!state.isServer()) return;

    for (const client of getClients(state)) {
      for (const msg of client.messages) {
        if (msg.type === 'entity:update') {
          for (const update of msg.updates) {
            // Verify ownership
            if (NetworkOwner.owner[update.entity] !== client.id) {
              console.warn(`Client ${client.id} tried to update entity they don't own`);
              continue;
            }

            // Apply update (no validation - weak security model)
            applyComponentUpdate(update.entity, update.components);
          }
        }
      }
    }
  }
};
```

---

## Auto-Transfer Plugin (Optional, Server-Only)

```typescript
// src/plugins/networking/auto-transfer-plugin.ts
export const AutoTransferSystem: System = {
  group: 'simulation',
  update: (state) => {
    if (!state.isServer()) return;

    const query = defineQuery([NetworkOwner, Transform, Not(NetworkLock)]);

    for (const entity of query(state.world)) {
      if (NetworkOwner.owner[entity] !== 0) continue;  // Already transferred

      // Find nearest client
      const nearest = findNearestClient(state, entity);

      if (nearest && distance(entity, nearest) < TRANSFER_RADIUS) {
        // Transfer ownership
        NetworkOwner.owner[entity] = nearest.id;

        // Broadcast ownership change
        broadcastToAllClients('ownership', {
          entity,
          owner: nearest.id
        });
      }
    }
  }
};

export const AutoReclaimSystem: System = {
  group: 'simulation',
  update: (state) => {
    if (!state.isServer()) return;

    const query = defineQuery([NetworkOwner, Transform, Not(NetworkLock)]);

    for (const entity of query(state.world)) {
      const owner = NetworkOwner.owner[entity];
      if (owner === 0) continue;  // Server owns

      // Check if client is too far
      if (distance(entity, owner) > RECLAIM_RADIUS) {
        // Reclaim to server
        NetworkOwner.owner[entity] = 0;

        broadcastToAllClients('ownership', {
          entity,
          owner: 0
        });
      }
    }
  }
};

export const AutoTransferPlugin: Plugin = {
  components: { NetworkLock },
  systems: [AutoTransferSystem, AutoReclaimSystem]
};
```

---

## Colyseus Integration

### Server Setup

```typescript
// server.ts
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GameRoom } from './game-room';

const server = new Server({
  transport: new WebSocketTransport({ port: 2567 })
});

server.define('game', GameRoom);
server.listen(2567);

console.log('Game server listening on ws://localhost:2567');
```

### Room Implementation

```typescript
// src/server/game-room.ts
import { Room, Client } from '@colyseus/core';
import { Schema, type, MapSchema } from '@colyseus/schema';
import { State } from '../core/ecs/state';
import { initializePhysics } from '../plugins/physics';
import * as GAME from '../index';

// Colyseus Schema for game-level state
export class GameState extends Schema {
  @type({ map: "number" }) scores = new MapSchema<number>();
}

export class GameRoom extends Room<GameState> {
  private ecsState: State;
  private gameLoop: NodeJS.Timeout;

  async onCreate(options: any) {
    this.setState(new GameState());

    // Initialize ECS with server context
    this.ecsState = new State({
      context: 'server'
    });

    await initializePhysics();

    // Load world
    this.ecsState.loadWorldFromXML(options.worldXml || DEFAULT_WORLD);

    // Start game loop (50Hz physics)
    this.gameLoop = setInterval(() => {
      this.ecsState.step(1/50);
    }, 20);

    // Handle client messages
    this.onMessage('entity:update', this.handleEntityUpdate.bind(this));
    this.onMessage('request-spawn', this.handleRequestSpawn.bind(this));
  }

  onJoin(client: Client, options: any) {
    console.log(`Client ${client.sessionId} joined`);

    // Create player entity (server creates it)
    const player = this.ecsState.createFromRecipe('player', {
      pos: [0, 2, 0]
    });

    // Transfer ownership to client
    const clientId = this.clientIdToNumber(client.sessionId);
    GAME.NetworkOwner.owner[player] = clientId;
    this.ecsState.addComponent(player, GAME.NetworkLock);

    // Send full snapshot to joining client
    client.send('snapshot', this.createSnapshot());

    // Update game state
    this.state.scores.set(client.sessionId, 0);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Client ${client.sessionId} left`);

    // Destroy player entity
    const clientId = this.clientIdToNumber(client.sessionId);
    const playerQuery = GAME.defineQuery([GAME.Player, GAME.NetworkOwner]);

    for (const entity of playerQuery(this.ecsState.world)) {
      if (GAME.NetworkOwner.owner[entity] === clientId) {
        this.ecsState.destroyEntity(entity);
        this.broadcast('destroy', { entity });
      }
    }

    this.state.scores.delete(client.sessionId);
  }

  onDispose() {
    clearInterval(this.gameLoop);
  }

  private handleEntityUpdate(client: Client, updates: any) {
    const clientId = this.clientIdToNumber(client.sessionId);

    for (const update of updates) {
      // Verify ownership
      if (GAME.NetworkOwner.owner[update.entity] !== clientId) {
        console.warn(`Client ${client.sessionId} tried to update entity they don't own`);
        continue;
      }

      // Apply update
      this.ecsState.applyComponentUpdate(update.entity, update.components);
    }
  }

  private handleRequestSpawn(client: Client, msg: any) {
    const clientId = this.clientIdToNumber(client.sessionId);

    // Create entity server-side
    const entity = this.ecsState.createEntity();
    this.ecsState.addComponent(entity, GAME.NetworkOwner, { owner: clientId });
    this.ecsState.addComponent(entity, GAME.NetworkLock);

    // Apply components
    this.ecsState.applyComponentData(entity, msg.components);

    // Broadcast spawn to all clients
    this.broadcast('spawn', {
      entity,
      owner: clientId,
      components: msg.components
    });

    // Confirm to requesting client
    client.send('spawn-confirm', {
      tempId: msg.tempId,
      entity
    });
  }

  private createSnapshot() {
    return {
      entities: this.ecsState.serializeAllEntities(),
      timestamp: Date.now()
    };
  }

  private clientIdToNumber(sessionId: string): number {
    // Convert session ID to numeric ID
    return parseInt(sessionId.replace(/[^\d]/g, '').slice(0, 8)) || 1;
  }
}
```

### Client Connection

```typescript
// Client code (main.ts)
import * as Colyseus from 'colyseus.js';
import * as GAME from 'vibegame';

async function start() {
  // Connect to server
  const client = new Colyseus.Client('ws://localhost:2567');

  const room = await client.joinOrCreate('game', {
    worldXml: document.querySelector('world')?.outerHTML
  });

  // Initialize client ECS
  const state = new GAME.State({
    context: 'client',
    clientId: clientIdToNumber(room.sessionId),
    room: room
  });

  // Setup message handlers
  room.onMessage('snapshot', (snapshot) => {
    state.applySnapshot(snapshot);
  });

  room.onMessage('spawn', (msg) => {
    const entity = state.createNetworkedEntity(msg.owner);
    state.applyComponentData(entity, msg.components);
  });

  room.onMessage('destroy', (msg) => {
    state.destroyEntity(msg.entity);
  });

  room.onMessage('ownership', (msg) => {
    GAME.NetworkOwner.owner[msg.entity] = msg.owner;
  });

  room.onMessage('entity:update', (updates) => {
    for (const update of updates) {
      state.applyComponentUpdate(update.entity, update.components);
    }
  });

  // Run client
  GAME.run();
}

start();
```

---

## Message Protocol

```typescript
// src/plugins/networking/protocol.ts

type NetworkMessage =
  // Server → Client: Entity spawned
  | {
      type: 'spawn';
      entity: number;
      owner: number;
      components: ComponentData;
    }

  // Server → Client: Entity destroyed
  | {
      type: 'destroy';
      entity: number;
    }

  // Server → Client: Ownership transferred
  | {
      type: 'ownership';
      entity: number;
      owner: number;  // 0=server, >0=clientId
    }

  // Bidirectional: Component updates
  | {
      type: 'entity:update';
      updates: EntityUpdate[];
    }

  // Client → Server: Request to spawn client-owned entity
  | {
      type: 'request-spawn';
      tempId: number;
      components: ComponentData;
    }

  // Server → Client: Confirm spawn with real ID
  | {
      type: 'spawn-confirm';
      tempId: number;
      entity: number;
    }

  // Server → Client: Full state snapshot (on join)
  | {
      type: 'snapshot';
      entities: SerializedEntity[];
      timestamp: number;
    };

type EntityUpdate = {
  entity: number;
  owner?: number;
  components: ComponentData;
};

type ComponentData = {
  [componentId: number]: {
    [property: string]: number;
  };
};
```

---

## Component Registration

### Automatic Registration (Default Plugins)

```typescript
// src/plugins/transforms/plugin.ts
export const TransformsPlugin: Plugin = {
  components: { Transform, WorldTransform },
  systems: [TransformHierarchySystem],

  // Register for networking
  networkComponents: {
    [Transform.id]: {
      properties: ['posX', 'posY', 'posZ', 'rotX', 'rotY', 'rotZ', 'rotW',
                    'scaleX', 'scaleY', 'scaleZ']
    }
  }
};
```

### Default Networked Components

| Component | Properties Synced | Notes |
|-----------|------------------|-------|
| Transform | pos, rot, scale | Always synced |
| Body | pos, rot, vel | Physics state |
| Renderer | color, visible | Visual state |
| Player | All properties | Player data |

### Components Never Networked

| Component | Reason |
|-----------|--------|
| InputState | Local input only |
| OrbitCamera | Local camera only |
| RenderContext | Local rendering only |
| PhysicsWorld | Server-only singleton |
| LocalOnly | Explicit local tag |

---

## File Structure

```
src/
├── core/
│   ├── ecs/
│   │   ├── state.ts           # Extended with context, clientId, room
│   │   └── types.ts
│   └── xml/
│       ├── parser.ts          # Parses networking attribute
│       └── components.ts      # Networking (authoring)
├── plugins/
│   ├── networking/
│   │   ├── index.ts           # Public API
│   │   ├── plugin.ts          # NetworkingPlugin
│   │   ├── components.ts      # NetworkOwner, NetworkLock, LocalOnly
│   │   ├── systems.ts         # Core sync systems
│   │   ├── auto-transfer.ts   # AutoTransferPlugin
│   │   ├── protocol.ts        # Message types
│   │   ├── serialization.ts   # Entity/component serialization
│   │   ├── interpolation.ts   # Client-side smoothing
│   │   └── registry.ts        # Component registration
│   ├── transforms/
│   │   └── plugin.ts          # networkComponents registration
│   ├── physics/
│   │   └── plugin.ts          # networkComponents registration
│   └── ...
├── server/
│   ├── index.ts               # Server exports
│   ├── game-room.ts           # Colyseus Room implementation
│   └── utils.ts               # Server utilities
└── index.ts                   # Client exports

package.json exports:
{
  "exports": {
    ".": "./dist/index.js",              // Client
    "./server": "./dist/server/index.js" // Server
  }
}
```

---

## Implementation Phases

### Phase 1: Core State Context
- [ ] Add `context`, `clientId`, `room` to State
- [ ] Implement context-aware `createEntity()`
- [ ] Add `isServer()` / `isClient()` methods

### Phase 2: Networking Components
- [ ] Define `Networking` (authoring)
- [ ] Define `NetworkOwner` (runtime)
- [ ] Define `NetworkLock`, `LocalOnly` (tags)
- [ ] Test component creation

### Phase 3: Colyseus Setup
- [ ] Add Colyseus dependencies
- [ ] Implement GameRoom class
- [ ] Test basic room connection
- [ ] Test player join/leave

### Phase 4: Message Protocol
- [ ] Define TypeScript message types
- [ ] Implement message queue on State
- [ ] Add message handlers (spawn, destroy, ownership, update)
- [ ] Test message round-trip

### Phase 5: Client Systems
- [ ] NetworkingInitSystem (convert authoring)
- [ ] ClientSendSystem (send owned updates)
- [ ] ClientMessageSystem (receive messages)
- [ ] ClientInterpolationSystem (smooth remote entities)
- [ ] Test client-side simulation

### Phase 6: Server Systems
- [ ] NetworkingInitSystem (convert authoring)
- [ ] ServerSimulationSystem (simulate server-owned)
- [ ] ServerBroadcastSystem (broadcast to clients)
- [ ] ServerReceiveSystem (receive client updates)
- [ ] Test server-side simulation

### Phase 7: Auto-Transfer Plugin
- [ ] AutoTransferSystem (transfer to nearby)
- [ ] AutoReclaimSystem (reclaim when far)
- [ ] Test ownership transfers
- [ ] Verify entity persistence

### Phase 8: XML Integration
- [ ] Parse `networking` attribute
- [ ] Convert to Networking component
- [ ] Test recipes with networking modes
- [ ] Document XML syntax

### Phase 9: Component Registry
- [ ] Add `networkComponents` to Plugin type
- [ ] Register Transform, Body, Renderer
- [ ] Implement selective serialization
- [ ] Test component filtering

### Phase 10: Example Game
- [ ] Create multiplayer ball-pushing example
- [ ] 2+ clients, 1 server
- [ ] Demonstrate auto-transfer
- [ ] Verify smooth ownership transitions

---

## Success Criteria

**MVP Complete When:**
1. ✅ Two clients connect to Colyseus room
2. ✅ Server spawns entities from XML
3. ✅ Transform/Body automatically networked
4. ✅ Client owns player, simulates smoothly
5. ✅ Ownership transfers without destroy/create
6. ✅ Remote entities interpolate smoothly
7. ✅ Auto-transfer works based on distance
8. ✅ Client-local entities never sent to server

**Performance Targets:**
- 20Hz update rate (50ms)
- <100ms perceived lag for owned entities
- 50Hz physics simulation on server
- Support 4-8 players initially
- <50KB/s bandwidth per client

---

## Design Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| Colyseus for transport | Battle-tested rooms/matchmaking | Additional dependency |
| Ownership changes, not destroy/create | No message conflicts | Requires entity ID coordination |
| Context-aware State | Simple defaults | Must track context |
| Authoring component | Clean XML syntax | Conversion overhead |
| Auto-transfer plugin | Optional feature | Server must track proximity |
| No validation | Weak security, simple | Cheating possible |
| Component registry | Selective sync | Requires explicit registration |

---

## Usage Examples

### Simple Game (Zero Config)

```xml
<!-- index.html -->
<world canvas="#game-canvas">
  <static-part pos="0 -0.5 0" shape="box" size="20 1 20"></static-part>
  <dynamic-part pos="0 5 0" shape="sphere"></dynamic-part>
</world>

<script type="module">
  import * as Colyseus from 'colyseus.js';
  import * as GAME from 'vibegame';

  const client = new Colyseus.Client('ws://localhost:2567');
  const room = await client.joinOrCreate('game');

  GAME.withColyseus(room).run();
</script>
```

**Result:** Ball auto-transfers to nearby players, smooth simulation.

### Server-Only Physics

```xml
<dynamic-part networking="server" pos="0 5 0" shape="sphere"></dynamic-part>
```

**Result:** Always simulated on server, clients interpolate.

### Custom Networked Component

```typescript
const Health = GAME.defineComponent({
  current: GAME.Types.f32,
  max: GAME.Types.f32
});

const HealthPlugin: GAME.Plugin = {
  components: { Health },
  systems: [HealthSystem],
  networkComponents: {
    [Health.id]: {
      properties: ['current', 'max']
    }
  }
};

GAME.withPlugin(HealthPlugin).run();
```

**Result:** Health syncs across clients automatically.

---

## Key Insights

1. **Entities persist, ownership changes** - Eliminates destroy/create conflicts
2. **Context-aware defaults** - Zero config for simple games
3. **Authoring vs runtime separation** - Clean XML syntax, efficient runtime
4. **Auto-transfer is optional** - Core networking is simpler
5. **No validation by default** - Simple implementation, users add security
6. **Component registry** - Only sync what's declared

---

**End of Architecture Document**

This architecture enables Roblox-style multiplayer with minimal components and maximum simplicity.
