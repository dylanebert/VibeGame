# Networking Plugin

<!-- LLM:OVERVIEW -->
Client-instance multiplayer using Colyseus. Each client runs full physics simulation, server stamps snapshots with tick numbers. Delay-buffered interpolation ensures smooth remote entity movement despite variable network timing. Supports multiple entities per session using composite keys (sessionId:entityId).
<!-- /LLM:OVERVIEW -->

## Architecture

**Client-Instance Model:**
- Each client runs complete physics simulation with zero latency
- Owned entities: Full physics, sent to server
- Remote entities: Kinematic ghosts, interpolated from server snapshots
- Local entities: Non-networked

**Server:**
- Receives structural updates (components) and position snapshots with entity IDs
- Stamps position updates with server tick
- Keys by composite key (sessionId:entityId) for multi-entity sessions
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
├── components.ts   # Owned, Networked
├── constants.ts    # Message type constants
├── types.ts        # NetworkState, BodyStateLike
├── state.ts        # NetworkState management
├── utils.ts        # String hashing
├── sync.ts         # Structural updates, snapshot buffer management
├── systems.ts      # Init, Sync, Interpolation, Send, Cleanup
├── plugin.ts       # Plugin definition
└── index.ts        # Public exports
```

## Scope

- Network any entity marked with Owned component
- Send structural updates (components) once per owned entity
- Send owned entity positions to server at fixed rate
- Observe server state, create/update/destroy remote entities iteratively
- Insert position snapshots into 3-snapshot buffer
- Interpolate with delay buffer at fixed rate

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

**Owned** - Tag component marking entities to send to server
**Networked** - 3-snapshot ring buffer (tick0-2, pos0-2, rot0-2), localRenderTick tracks client interpolation position

### Systems

**NetworkInitSystem** (setup, first) - Connection management, offline cleanup
**NetworkStructuralSendSystem** (setup) - Sends structural updates for new owned entities
**NetworkSyncSystem** (setup) - Observes server state, creates/destroys remote entities, inserts snapshots
**NetworkBufferConsumeSystem** (fixed, before KinematicMovementSystem) - Interpolates between snapshots
**NetworkSendSystem** (fixed, after PhysicsRapierSyncSystem) - Sends owned positions
**NetworkCleanupSystem** (dispose) - Disconnect cleanup

### State Management

**NetworkState** - `room`, `sessionId`, `compositeKeyToEntity`, `remoteEntities`, `initializedEntities`
**getNetworkState(state)** - Get or create network state

### Sync Functions

**handleIncomingStructuralUpdate** - Create/update remote entity from structural data
**syncRemoteBody** - Insert snapshot into ring buffer
**sendStructuralUpdates** - Send component data for new owned entities

### Types

**BodyStateLike** - Position, rotation, tick
**StructuralUpdate** - Entity component data for network spawning
**NetworkState** - Network state container
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
