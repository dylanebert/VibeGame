# Networking Plugin

<!-- LLM:OVERVIEW -->
Hybrid multiplayer using Colyseus with emergent state synchronization. Server-authoritative by default, client-owned entities opt-in via ClientAuthority. Server parses world XML and spawns entities, clients spawn their own ClientAuthority entities. Delay-buffered interpolation for smooth movement.
<!-- /LLM:OVERVIEW -->

## Architecture

**Authority Model:**
- Server entities: Server-authoritative, created by server from world XML
- Client-owned entities: ClientAuthority component, full local physics with server relay
- Client-local entities: No authority component, exist only on client (not networked)
- Remote entities: Kinematic ghosts, interpolated from server snapshots
- Orphan cleanup: Bodies without ClientAuthority or RemoteSnapshot destroyed when connected
- Offline: All entities work locally without networking

**Entity Creation Semantics (Roblox-like):**
- Server creates entity → Automatically networked (ServerAuthority added by server)
- Client creates entity (default) → Local only, not networked
- Client creates entity with ClientAuthority → Networked to server and other clients

**Room Initialization:**
- Room starts immediately in active state
- Server parses world XML and spawns server-authoritative entities on creation
- Clients connect and receive server state via continuous observation
- Clients spawn their own ClientAuthority entities (e.g., player)
- Continuous observation of server state creates/updates/destroys remote entities
- Self-healing every frame eliminates race conditions

**Network ID System:**
- Server assigns globally unique network IDs to all entities
- Clients request network IDs before sending entity data
- Bidirectional mapping: networkId ↔ localEntity
- Decouples network identity from local ECS entity IDs

**Server:**
- Receives structural updates and position snapshots with network IDs
- Stamps position updates with server tick
- Keys by network ID for collision-free entity identification
- Validates (bounds, NaN checks)
- Broadcasts via Colyseus MapSchema auto-sync

**Iterative State Observation:**
- Clients observe server MapSchema state every frame
- Entity lifecycle (create/update/delete) driven by what exists in server state
- Self-healing: missed updates corrected on next frame
- Consistent pattern for all state changes

**Snapshot Interpolation:**
- 3-snapshot ring buffer stores recent server states with tick timestamps
- Renders ~6 ticks behind latest snapshot (100ms delay buffer)
- Finds bracketing snapshots, interpolates based on tick delta
- Only generates kinematic movements when new server data arrives
- Handles variable network rate independently from fixed physics rate

## Layout

```
networking/
├── context.md
├── components.ts   # NetworkIdentity, ClientAuthority, ServerAuthority, RemoteSnapshot
├── constants.ts    # Message types, delays, timeouts
├── types.ts        # NetworkState, BodyStateLike
├── state.ts        # NetworkState management
├── utils.ts        # String hashing
├── sync.ts         # Structural updates, snapshot buffer management
├── systems.ts      # Init, AuthorityCleanup, StructuralSend, Sync, BufferConsume, Send, Cleanup
├── plugin.ts       # Plugin definition
└── index.ts        # Public exports
```

## Scope

- Emergent state synchronization via continuous observation
- Network client-owned entities with ClientAuthority component
- Server-authoritative shared entities (default for physics bodies)
- Observe server state, create/update/destroy remote entities
- Insert position snapshots into 3-snapshot buffer
- Interpolate with delay buffer at fixed rate
- Offline mode without networking

### Component Networking

**Plugins declare networked components** in their definition. Only explicitly declared components are synchronized across the network.

**Currently networked:**
- **body** (PhysicsPlugin) - Position and rotation for interpolation
- **renderer** (RenderingPlugin) - Visual appearance (shape, size, color)
- **animated-character** (AnimationPlugin) - Animation state for remote players

**To network a custom component**, add it to your plugin's `networked` field using component references:

```typescript
import type { Plugin } from 'vibegame';
import { MyComponent } from './components';

export const MyPlugin: Plugin = {
  components: { MyComponent },
  networked: [MyComponent],  // Type-safe component reference
  // ... other plugin fields
};
```

## Dependencies

- External: Colyseus client SDK (colyseus.js)
- Internal: Physics plugin (Body, KinematicMove, KinematicRotate, systems)

<!-- LLM:REFERENCE -->
## API Reference

### Components

**NetworkIdentity** - Stores server-assigned network ID for entity
**ClientAuthority** - Marks entity as client-owned (full local physics, sent to server)
**ServerAuthority** - Marks entity as server-authoritative (interpolated from server)
**RemoteSnapshot** - 3-snapshot ring buffer for interpolation (tick0-2, pos0-2, rot0-2)

### Systems

**NetworkInitSystem** (setup, first) - Connection management, network ID assignment, offline cleanup
**NetworkAuthorityCleanupSystem** (setup) - Destroys orphaned bodies without authority when connected
**NetworkStructuralSendSystem** (setup) - Requests network IDs, sends client-owned entity updates
**NetworkSyncSystem** (setup) - Observes server state, creates/destroys remote entities, inserts snapshots
**NetworkBufferConsumeSystem** (fixed, before KinematicMovementSystem) - Interpolates remote entities
**NetworkSendSystem** (fixed, after PhysicsRapierSyncSystem) - Sends client-owned positions
**NetworkCleanupSystem** (dispose) - Disconnect cleanup

### State Management

**NetworkState** - `room`, `sessionId`, `networkIdToEntity`, `entityToNetworkId`, `remoteEntities`, `initializedEntities`, `pendingNetworkIdRequests`
**getNetworkState(state)** - Get or create network state

### Sync Functions

**handleIncomingStructuralUpdate** - Create/update remote entity from structural data using network ID
**syncRemoteBody** - Insert snapshot into ring buffer using network ID
**sendStructuralUpdates** - Request network IDs and send component data for new owned entities

### Types

**BodyStateLike** - Position, rotation, tick
**StructuralUpdate** - Entity component data with network ID
**NetworkState** - Network state container with bidirectional network ID mapping
<!-- /LLM:REFERENCE -->

## Usage

### Client Connection
```typescript
import { Client } from 'colyseus.js';
import { getNetworkState, NetworkingPlugin } from 'vibegame';

const runtime = await GAME.withPlugin(NetworkingPlugin).run();
const state = runtime.getState();

const client = new Client('ws://localhost:2567');
const room = await client.joinOrCreate('game');

const netState = getNetworkState(state);
netState.room = room;
```

### Server Setup
```typescript
import { createGameServer } from 'vibegame/server';

createGameServer({ port: 2567 });
```

## Benefits

- Zero latency for local gameplay
- Smooth remote movement via delay-buffered interpolation
- Self-healing state synchronization
- Consistent iterative pattern for all entity lifecycle events
- Minimal server CPU (relay only, no simulation)
- Handles variable network timing and packet loss
- Physics plugin unaware of networking
- Clean ECS integration via kinematic components
