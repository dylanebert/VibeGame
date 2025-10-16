# Network Ownership - Minimal Implementation Plan

**Goal:** Network ownership model (Roblox-style) with immediate client responsiveness

**Philosophy:** Start with the simplest possible implementation that has the right architecture to scale to full networking features.

---

## Core Architecture

### 1. State Context

Extend `State` class to know if it's running on client or server:

```typescript
// src/core/ecs/state.ts
export type StateContext = 'client' | 'server';

export interface StateOptions {
  context?: StateContext;
  playerId?: number;  // For clients: which player am I?
}

export class State {
  public readonly context: StateContext;
  public readonly playerId?: number;

  constructor(options: StateOptions = {}) {
    this.context = options.context ?? 'client';
    this.playerId = options.playerId;
    // ... rest of existing constructor
  }

  isClient(): boolean { return this.context === 'client'; }
  isServer(): boolean { return this.context === 'server'; }
}
```

**Why:** Same State class for client and server. Systems check context to behave differently.

**Scales to:** Advanced features can add more context types if needed, but client/server is sufficient.

---

### 2. Minimal Components

**One component for MVP:**

```typescript
// src/plugins/networking/components.ts
export const NetworkedEntity = defineComponent({
  owner: Types.ui32,  // 0 = server, >0 = player entity ID
});
```

**That's it.** Owner field is all we need to implement network ownership.

**Scales to:** Additional components for replication control, smoothing, stats, etc. can be added later as separate components. Core ownership remains this simple.

---

### 3. Message Protocol

**Minimal messages:**

```typescript
// src/plugins/networking/messages.ts
type NetworkMessage =
  | { type: 'connect', playerId: number }
  | { type: 'disconnect', playerId: number }
  | { type: 'state', entities: EntityState[] }
  | { type: 'spawn', entity: number, recipe: string, attributes: any }
  | { type: 'destroy', entity: number }
  | { type: 'transfer-owner', entity: number, owner: number };

type EntityState = {
  entity: number;
  owner: number;
  pos: [number, number, number];
  rot: [number, number, number, number];  // quaternion
  vel: [number, number, number];
};
```

**Why:** Just enough to replicate physics state. No priority, no compression, no custom events.

**Scales to:** Can add message types without changing core protocol structure.

---

### 4. Transport Interface

**Minimal transport abstraction:**

```typescript
// src/plugins/networking/transport.ts
export interface NetworkTransport {
  send(message: NetworkMessage): void;
  receive(): NetworkMessage[];
  connect(url: string): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
}

// Initial implementation: WebSocket
export class WebSocketTransport implements NetworkTransport {
  private ws: WebSocket | null = null;
  private messageQueue: NetworkMessage[] = [];

  async connect(url: string): Promise<void> {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (event) => {
      this.messageQueue.push(JSON.parse(event.data));
    };
    // ... handle open/close/error
  }

  send(message: NetworkMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  receive(): NetworkMessage[] {
    const messages = this.messageQueue;
    this.messageQueue = [];
    return messages;
  }
}
```

**Why:** Simple, synchronous receive(). No async complexity in systems.

**Scales to:** Can swap WebRTC, custom protocols, etc. without changing system code.

---

### 5. Core Systems

**Client systems (minimal):**

```typescript
// src/plugins/networking/systems.ts

// Send owned entities to server
export const NetworkSendSystem: System = {
  group: 'fixed',
  last: true,
  update: (state) => {
    if (!state.isClient()) return;

    const query = defineQuery([NetworkedEntity, Body]);
    const entities: EntityState[] = [];

    for (const eid of query(state.world)) {
      // Only send entities we own
      if (NetworkedEntity.owner[eid] !== state.playerId) continue;

      entities.push({
        entity: eid,
        owner: state.playerId!,
        pos: [Body.posX[eid], Body.posY[eid], Body.posZ[eid]],
        rot: [Body.rotX[eid], Body.rotY[eid], Body.rotZ[eid], Body.rotW[eid]],
        vel: [Body.velX[eid], Body.velY[eid], Body.velZ[eid]],
      });
    }

    if (entities.length > 0) {
      getTransport(state).send({ type: 'state', entities });
    }
  }
};

// Receive remote entities from server
export const NetworkReceiveSystem: System = {
  group: 'setup',
  first: true,
  update: (state) => {
    if (!state.isClient()) return;

    const messages = getTransport(state).receive();

    for (const msg of messages) {
      if (msg.type === 'state') {
        for (const entityState of msg.entities) {
          const eid = entityState.entity;

          // Don't apply to entities we own (we're authoritative)
          if (NetworkedEntity.owner[eid] === state.playerId) continue;

          // Apply server state
          Body.posX[eid] = entityState.pos[0];
          Body.posY[eid] = entityState.pos[1];
          Body.posZ[eid] = entityState.pos[2];
          Body.rotX[eid] = entityState.rot[0];
          Body.rotY[eid] = entityState.rot[1];
          Body.rotZ[eid] = entityState.rot[2];
          Body.rotW[eid] = entityState.rot[3];
          Body.velX[eid] = entityState.vel[0];
          Body.velY[eid] = entityState.vel[1];
          Body.velZ[eid] = entityState.vel[2];
        }
      }
      // Handle spawn, destroy, transfer-owner...
    }
  }
};
```

**Server systems (minimal):**

```typescript
// Receive client updates
export const ServerReceiveSystem: System = {
  group: 'setup',
  first: true,
  update: (state) => {
    if (!state.isServer()) return;

    // For each connected client
    for (const client of getClients(state)) {
      const messages = client.transport.receive();

      for (const msg of messages) {
        if (msg.type === 'state') {
          for (const entityState of msg.entities) {
            const eid = entityState.entity;

            // Verify client owns this entity
            if (NetworkedEntity.owner[eid] !== client.playerId) {
              console.warn(`Client ${client.playerId} tried to update entity ${eid} they don't own`);
              continue;
            }

            // Apply client state (they're authoritative)
            Body.posX[eid] = entityState.pos[0];
            Body.posY[eid] = entityState.pos[1];
            Body.posZ[eid] = entityState.pos[2];
            // ... etc
          }
        }
      }
    }
  }
};

// Broadcast to all clients
export const ServerBroadcastSystem: System = {
  group: 'fixed',
  last: true,
  update: (state) => {
    if (!state.isServer()) return;

    const query = defineQuery([NetworkedEntity, Body]);
    const entities: EntityState[] = [];

    for (const eid of query(state.world)) {
      entities.push({
        entity: eid,
        owner: NetworkedEntity.owner[eid],
        pos: [Body.posX[eid], Body.posY[eid], Body.posZ[eid]],
        rot: [Body.rotX[eid], Body.rotY[eid], Body.rotZ[eid], Body.rotW[eid]],
        vel: [Body.velX[eid], Body.velY[eid], Body.velZ[eid]],
      });
    }

    // Send to all clients
    for (const client of getClients(state)) {
      client.transport.send({ type: 'state', entities });
    }
  }
};
```

**Why:** Naive broadcast to all clients. Owner sends, server replicates to others.

**Scales to:** Can add:
- Per-client filtering (don't send back to owner)
- Sync rate throttling
- Delta compression
- Priority-based updates

---

### 6. Minimal API

```typescript
// src/plugins/networking/index.ts
export function setNetworkOwner(state: State, entity: number, owner: number | 'server'): void {
  const ownerEid = owner === 'server' ? 0 : owner;
  NetworkedEntity.owner[entity] = ownerEid;

  if (state.isServer()) {
    // Broadcast ownership change
    for (const client of getClients(state)) {
      client.transport.send({
        type: 'transfer-owner',
        entity,
        owner: ownerEid
      });
    }
  }
}

export function getNetworkOwner(state: State, entity: number): number {
  return NetworkedEntity.owner[entity];
}

export function isOwnedByLocalPlayer(state: State, entity: number): boolean {
  return state.isClient() && NetworkedEntity.owner[entity] === state.playerId;
}
```

**Why:** Three functions. Manual ownership control only.

**Scales to:** Can add `requestOwnership()`, auto-transfer systems, etc. Core ownership API stays minimal.

---

## Server vs Client Structure

### Problem: Server doesn't run in browser

**Client loads XML from DOM:**
```typescript
// Client: src/runtime.ts (existing)
export function run() {
  const state = new State({ context: 'client' });
  const worldElement = document.querySelector('world');
  parseXMLAndCreateEntities(state, worldElement);
  // ...
}
```

**Server needs different entry point:**
```typescript
// Server: src/server/runtime.ts (NEW)
export class GameServer {
  private state: State;
  private clients: Map<number, ClientConnection> = new Map();
  private nextPlayerId = 1;

  constructor(options: { port: number }) {
    this.state = new State({ context: 'server' });
    // Initialize WebSocket server on port
  }

  loadWorld(xmlString: string): void {
    // Parse XML string (not DOM)
    const parsed = parseXMLString(xmlString);
    createEntitiesFromParsedXML(this.state, parsed);
  }

  async start(): Promise<void> {
    // Start game loop
    setInterval(() => {
      this.state.step(1/50); // 50Hz
    }, 20);
  }
}

// Usage:
import { GameServer } from 'vibegame/server';

const server = new GameServer({ port: 8080 });
server.loadWorld(`
  <world>
    <static-part pos="0 -0.5 0" shape="box" size="20 1 20"></static-part>
  </world>
`);
await server.start();
```

**Why:** Server needs string-based XML loading, not DOM traversal.

**File structure:**
```
src/
├── core/           # Shared between client and server
│   ├── ecs/
│   └── xml/
├── plugins/        # Shared between client and server
│   ├── physics/
│   └── networking/
├── runtime.ts      # Client runtime (browser, uses DOM)
├── server/         # Server-only code
│   ├── runtime.ts  # GameServer class
│   └── index.ts    # Server exports
└── index.ts        # Client exports (existing)
```

**Package.json exports:**
```json
{
  "exports": {
    ".": "./dist/index.js",              // Client
    "./server": "./dist/server/index.js" // Server
  }
}
```

---

## XML Integration (Minimal)

```xml
<!-- Client creates player automatically -->
<world canvas="#game-canvas">
  <!-- Static ground (server-owned by default) -->
  <static-part pos="0 -0.5 0" shape="box" size="20 1 20"></static-part>

  <!-- Dynamic ball (server-owned by default) -->
  <dynamic-part pos="0 5 0" shape="sphere"></dynamic-part>
</world>
```

**Defaults for MVP:**
- All entities server-owned (owner=0) by default
- Developer must manually transfer ownership via `setNetworkOwner()`

**Scales to:**
```xml
<!-- Future: declarative ownership -->
<dynamic-part pos="0 5 0" shape="sphere" network="client"></dynamic-part>
<dynamic-part pos="5 5 0" shape="sphere" network-owner="auto"></dynamic-part>
```

---

## Implementation Phases

### Phase 1: State Context
- [ ] Add `context` and `playerId` to State constructor
- [ ] Add `isClient()` and `isServer()` methods
- [ ] Test: Create client state, server state

### Phase 2: Components
- [ ] Create `src/plugins/networking/components.ts`
- [ ] Define `NetworkedEntity` component
- [ ] Test: Add component to entity, set owner

### Phase 3: Transport
- [ ] Create `NetworkTransport` interface
- [ ] Implement `WebSocketTransport`
- [ ] Test: Connect, send, receive messages

### Phase 4: Server Runtime
- [ ] Create `src/server/runtime.ts`
- [ ] Implement `GameServer` class
- [ ] Add `loadWorld(xmlString)` method
- [ ] Test: Load XML from string, create entities

### Phase 5: Systems
- [ ] Implement `NetworkSendSystem` (client)
- [ ] Implement `NetworkReceiveSystem` (client)
- [ ] Implement `ServerReceiveSystem` (server)
- [ ] Implement `ServerBroadcastSystem` (server)
- [ ] Test: Client sends, server receives, broadcasts

### Phase 6: Ownership API
- [ ] Implement `setNetworkOwner()`
- [ ] Implement `getNetworkOwner()`
- [ ] Implement `isOwnedByLocalPlayer()`
- [ ] Test: Transfer ownership, verify authority

### Phase 7: Plugin Definition
- [ ] Create `NetworkingPlugin` with systems and components
- [ ] Test: Add plugin to client, add plugin to server

### Phase 8: Example
- [ ] Create ball-pushing example (2 clients, 1 server)
- [ ] Verify immediate responsiveness for owner
- [ ] Verify smooth replication for non-owner

---

## What This Enables (MVP Scenarios)

### Scenario 1: Manual Ownership Transfer

```typescript
// Ball ownership transfers on collision
const BallOwnershipSystem: System = {
  update: (state) => {
    if (!state.isServer()) return; // Server decides ownership

    const touchedQuery = defineQuery([TouchedEvent, NetworkedEntity]);
    for (const ball of touchedQuery(state.world)) {
      const player = TouchedEvent.other[ball];
      if (hasComponent(player, Player)) {
        const playerId = PlayerIdentity.playerId[player];
        setNetworkOwner(state, ball, playerId);
      }
    }
  }
};
```

### Scenario 2: Server-Owned Physics

```typescript
// Server owns all balls by default
const server = new GameServer({ port: 8080 });
server.loadWorld(`
  <world>
    <static-part pos="0 -0.5 0" shape="box" size="20 1 20"></static-part>
    <dynamic-part pos="0 5 0" shape="sphere"></dynamic-part>
  </world>
`);

// All entities have owner=0 (server)
// Server simulates physics, broadcasts to clients
await server.start();
```

### Scenario 3: Client-Owned Player

```typescript
// Server assigns player ownership when connecting
const PlayerConnectionSystem: System = {
  update: (state) => {
    if (!state.isServer()) return;

    for (const newConnection of getNewConnections(state)) {
      const playerId = newConnection.playerId;

      // Spawn player entity
      const player = state.createFromRecipe('player', { pos: [0, 5, 0] });
      state.addComponent(player, NetworkedEntity);

      // Client owns their own player
      setNetworkOwner(state, player, playerId);
    }
  }
};
```

---

## What We're NOT Implementing (Yet)

**Deferred to later:**
- ❌ Auto-ownership transfer (proximity, interaction)
- ❌ Dynamic sync rates (fixed 30Hz for MVP)
- ❌ Network smoothing (InterpolatedTransform can be used manually)
- ❌ Priority-based bandwidth limiting
- ❌ Delta compression
- ❌ Custom network messages (just state updates)
- ❌ Per-client filtering (naive broadcast)
- ❌ Validation hooks (developer adds systems)
- ❌ Network stats tracking
- ❌ XML declarative ownership (`network="client"`)

**Why defer:** Each adds complexity. MVP proves core ownership model works. These are additive features that don't change architecture.

---

## Key Architectural Decisions

| Decision | Rationale | Scales How? |
|----------|-----------|-------------|
| Single `State` class | No duplication, same code everywhere | Add fields as needed |
| One component (`NetworkedEntity`) | Owner field is all we need | Add replication, smoothing components later |
| Naive broadcast | Simple, correct, works | Add filtering without protocol changes |
| Manual ownership only | No auto-transfer complexity | Add auto-transfer systems later |
| Fixed 30Hz sync | No per-entity rate logic | Add `syncRate` field to component later |
| String-based server XML | Server doesn't use DOM | Existing XML parser works with strings |
| WebSocket only | Simple transport | Transport interface allows swapping |

---

## Success Criteria

**MVP is complete when:**
1. Two clients can connect to one server
2. Server spawns a ball (owner=0)
3. Server transfers ownership to client via `setNetworkOwner()`
4. Owning client moves ball immediately (zero lag)
5. Non-owning client sees ball movement smoothly
6. Server can take back ownership
7. All clients see consistent state (within latency)

**Performance targets:**
- 30Hz state updates (33ms interval)
- <50ms perceived lag for owned entities (network RTT)
- 50Hz physics simulation on server
- Works with 2-4 clients initially

---

## Open Questions

1. **Entity ID synchronization:** How do we ensure entity IDs are consistent across client/server?
   - **Proposal:** Server creates all entities, assigns IDs, clients receive spawn messages

2. **Physics simulation:** Who runs physics for owned entities?
   - **Proposal:** Owner runs physics, server trusts owner (weak security model)

3. **Player entity creation:** When does server spawn player?
   - **Proposal:** On connection, server creates player entity and assigns ownership

4. **Respawn system:** How to handle player falling?
   - **Proposal:** Server owns respawn logic, teleports player via state update

---

## Next Steps

1. Implement Phase 1 (State Context)
2. Create minimal example (1 server, 1 client, 1 ball)
3. Test ownership transfer
4. Verify zero-lag for owner
5. Document findings
6. Iterate on protocol if needed

---

**End of Plan**

This is the minimal foundation. Everything else is additive.
