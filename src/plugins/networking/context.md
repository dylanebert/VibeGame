# Networking Plugin

<!-- LLM:OVERVIEW -->
Client-instance multiplayer using Colyseus. Each client runs full physics simulation, server stamps snapshots with tick numbers. Delay-buffered interpolation ensures smooth remote entity movement despite variable network timing.
<!-- /LLM:OVERVIEW -->

## Architecture

**Client-Instance Model:**
- Each client runs complete physics simulation with zero latency
- Owned entities: Full physics, sent to server
- Remote entities: Kinematic ghosts, interpolated from server snapshots
- Local entities: Non-networked

**Server:**
- Receives position snapshots, stamps with server tick
- Validates (bounds, NaN checks)
- Broadcasts via Colyseus auto-sync

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
├── sync.ts         # Remote body snapshot storage
├── systems.ts      # Init, Sync, Interpolation, Send, Cleanup
├── plugin.ts       # Plugin definition
└── index.ts        # Public exports
```

## Scope

- Network any entity marked with Owned component
- Send owned entity positions to server at fixed rate
- Receive server snapshots, insert into 3-snapshot buffer
- Interpolate with delay buffer at fixed rate
- Create/destroy remote entities as kinematic bodies

## Dependencies

- External: Colyseus client SDK (colyseus.js)
- Internal: Physics plugin (Body, KinematicMove, KinematicRotate, systems)

<!-- LLM:REFERENCE -->
## API Reference

### Components

**Owned** - Tag component marking entities to send to server
**Networked** - 3-snapshot ring buffer (tick0-2, pos0-2, rot0-2), localRenderTick tracks client interpolation position

### Systems

**NetworkInitSystem** (setup, first) - Connection management
**NetworkSyncSystem** (setup) - Receives snapshots, inserts into ring buffer
**NetworkBufferConsumeSystem** (fixed, before KinematicMovementSystem) - Interpolates between snapshots using auto-incrementing local render tick
**NetworkSendSystem** (fixed, after PhysicsRapierSyncSystem) - Sends owned positions
**NetworkCleanupSystem** (dispose) - Disconnect cleanup

### State Management

**NetworkState** - `room`, `sessionId`, `sessionIdToEntity` map
**getNetworkState(state)** - Get or create network state

### Sync Functions

**syncRemoteBody** - Insert snapshot into ring buffer
**cleanupMissingBodies** - Destroy entities for disconnected sessions

### Types

**BodyStateLike** - Position, rotation, tick
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
- Minimal server CPU (relay only, no simulation)
- Handles variable network timing
- Physics plugin unaware of networking
- Clean ECS integration via kinematic components
- No duplicate kinematic movements
