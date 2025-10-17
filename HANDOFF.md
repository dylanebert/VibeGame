# Multiplayer Networking - Roblox-Style Architecture

**Goal:** Server-authoritative multiplayer with automatic client simulation transfer, zero configuration for simple games.

**Philosophy:** Entities persist across ownership changes. Server controls entity lifecycle. Clients smoothly transition between simulating and interpolating.

---

## Core Principles

1. **Entities persist** - Ownership changes without destroy/create
2. **Auto-transfer** - Server delegates simulation to nearby clients automatically
3. **Simple client** - Clients don't track transfer history, just current owner
4. **Server authority** - Server controls lifecycle, can reclaim entities
5. **ECS-idiomatic** - Systems query components and act. No event handlers.

---

## Component Architecture

### Authoring Component (Ephemeral)

```typescript
// src/core/xml/components.ts
export const Networking = defineComponent({
  mode: Types.ui8  // 0=auto, 1=server, 2=client
});

export enum NetworkMode {
  Auto = 0,    // Context-aware: server=networked+transferable, client=local-only
  Server = 1,  // Server-owned, never transfers
  Client = 2   // Client-owned, broadcast to server
}
```

**Used in XML, removed at runtime:**
```xml
<!-- Server: Auto (default): server-owned, auto-transferable -->
<dynamic-part pos="0 5 0"></dynamic-part>

<!-- Server: Server mode: server-owned, never transfers -->
<dynamic-part networking="server" pos="0 5 0"></dynamic-part>

<!-- Client: Auto (default): client-only, never sent to server -->
<dynamic-part pos="0 5 0"></dynamic-part>

<!-- Client: Client mode: client-owned, broadcast to server -->
<dynamic-part networking="client" pos="0 5 0"></dynamic-part>
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

// Interpolation target state for remote entities (client-side)
export const NetworkState = defineComponent({
  targetPosX: Types.f32,
  targetPosY: Types.f32,
  targetPosZ: Types.f32,
  targetRotX: Types.f32,
  targetRotY: Types.f32,
  targetRotZ: Types.f32,
  targetRotW: Types.f32,
});
```

**That's it.** Four runtime components total.

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

### 4. Local-Only

**Client code:**
```typescript
const particle = state.createEntity();
state.addComponent(particle, LocalOnly);  // Explicitly mark as local
state.addComponent(particle, Renderer);
```

**Runtime (Client):**
- `LocalOnly` tag
- No `NetworkOwner`
- Simulate locally, never sent to server

**Runtime (Server):**
- Entity doesn't exist

---

## State Context

State needs to know if it's running on server or client:

```typescript
// src/core/ecs/state.ts - Minimal additions
export type StateContext = 'server' | 'client';

export class State {
  public readonly context: StateContext;  // Add this
  public readonly clientId?: number;      // Add this (for client)
  public readonly room?: ColyseusRoom;    // Add this (for client)

  // Constructor accepts these options
  constructor(options?: { context?: StateContext; clientId?: number; room?: ColyseusRoom }) {
    this.context = options?.context ?? 'client';
    this.clientId = options?.clientId;
    this.room = options?.room;
    // ... rest of existing constructor
  }
}
```

**That's it.** Don't override `createEntity()` or add helper methods. Systems handle networking logic.

---

## Networking Plugin

### System Responsibilities (High-Level)

**Server Systems:**
- Convert `Networking` authoring component to runtime components
- Simulate entities with `NetworkOwner(owner=0)`
- Broadcast entity state to all clients
- Receive and validate client updates
- (Optional) Auto-transfer ownership based on proximity

**Client Systems:**
- Convert `Networking` authoring component for client-owned entities
- Send updates for entities with `NetworkOwner(owner=myClientId)`
- Receive messages from server and update `NetworkOwner` + `NetworkState`
- Interpolate entities with `NetworkState` component

**Systems query for components and act on them.** No event handlers.

### System Patterns

**Convert Authoring Component:**
```typescript
// Query for Networking component, convert to runtime components
const query = defineQuery([Networking]);
for (const entity of query(state.world)) {
  const mode = Networking.mode[entity];

  // On server: Add NetworkOwner(owner=0), optionally NetworkLock
  // On client: If mode=Client, add NetworkOwner(owner=clientId), send spawn request

  state.removeComponent(entity, Networking);
}
```

**Client Send Updates:**
```typescript
// Query entities I own, send their Transform data
const query = defineQuery([NetworkOwner, Transform]);
for (const entity of query(state.world)) {
  if (NetworkOwner.owner[entity] === state.clientId) {
    // Send Transform data via state.room.send()
  }
}
```

**Client Interpolate:**
```typescript
// Query remote entities, interpolate Transform toward NetworkState target
const query = defineQuery([NetworkOwner, Transform, NetworkState]);
for (const entity of query(state.world)) {
  if (NetworkOwner.owner[entity] !== state.clientId) {
    // Lerp Transform toward NetworkState targets
  }
}
```

**Client Receive Messages:**
```typescript
// Process messages from state.room.onMessage() callbacks
// - spawn: Create entity, add components
// - destroy: Remove entity
// - ownership: Update NetworkOwner.owner
// - update: Update NetworkState targets
```

**Server Broadcast:**
```typescript
// Query networked entities, send state to all clients
const query = defineQuery([NetworkOwner, Transform]);
for (const entity of query(state.world)) {
  // Collect Transform data, send via room.broadcast()
}
```

**Server Receive:**
```typescript
// Process messages from client
// Verify NetworkOwner matches sender
// Update entity components
```

---

## Auto-Transfer Plugin (Optional, Server-Only)

**Transfer to nearby client:**
```typescript
// Query server-owned entities without NetworkLock
const query = defineQuery([NetworkOwner, Transform, Not(NetworkLock)]);
for (const entity of query(state.world)) {
  if (NetworkOwner.owner[entity] === 0) {
    // Find nearest client player
    // If close enough, set NetworkOwner.owner = clientId
    // Broadcast ownership change
  }
}
```

**Reclaim from far client:**
```typescript
// Query client-owned entities without NetworkLock
const query = defineQuery([NetworkOwner, Transform, Not(NetworkLock)]);
for (const entity of query(state.world)) {
  const owner = NetworkOwner.owner[entity];
  if (owner > 0) {
    // Check distance to owner's player entity
    // If too far, set NetworkOwner.owner = 0
    // Broadcast ownership change
  }
}
```

---

## Colyseus Integration

**Server Pattern:**
```typescript
// Create Colyseus Room
class GameRoom extends Room {
  private state: State;

  onCreate() {
    // Initialize State with context='server'
    this.state = new State({ context: 'server' });

    // Start game loop: this.state.step(deltaTime)

    // Setup message handlers: this.onMessage('entity:update', ...)
  }

  onJoin(client: Client) {
    // Create player entity
    // Set NetworkOwner.owner = clientId
    // Add NetworkLock
    // Send snapshot to client
  }

  onLeave(client: Client) {
    // Find and destroy player entities owned by this client
    // Broadcast destroy messages
  }
}
```

**Client Pattern:**
```typescript
// Connect to Colyseus
const room = await client.joinOrCreate('game');

// Initialize State with context='client', clientId, and room
const state = new State({
  context: 'client',
  clientId: parseClientId(room.sessionId),
  room: room
});

// Setup message handlers: room.onMessage('spawn', ...)
// Run game: GAME.run() or similar
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
