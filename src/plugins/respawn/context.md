# Respawn Plugin

<!-- LLM:OVERVIEW -->
Automatic respawn system that resets entities when falling below Y=-100.
<!-- /LLM:OVERVIEW -->

## Layout

```
respawn/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # Respawn component
├── systems.ts  # RespawnSystem
└── utils.ts  # Respawn utilities
```

## Scope

- **In-scope**: Respawn position tracking, fall detection, state reset
- **Out-of-scope**: Death animations, checkpoints, game over screens

## Entry Points

- **index.ts**: Exports `Respawn` component and `RespawnPlugin`
- **systems.ts**: `RespawnSystem` runs during simulation phase

## Dependencies

- **Internal**: Transforms, Physics, Player components
- **External**: None

<!-- LLM:REFERENCE -->
### Components

#### Respawn
- posX, posY, posZ: f32 - Spawn position
- eulerX, eulerY, eulerZ: f32 - Spawn rotation (degrees)

### Systems

#### RespawnSystem
- Group: simulation
- Resets entities when Y < -100
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Player with Respawn (Automatic)

The `<player>` recipe automatically includes respawn:

```xml
<world>
  <!-- Player spawns at 0,5,0 and respawns there if falling -->
  <player pos="0 5 0"></player>
</world>
```

### Manual Respawn Component

```xml
<entity transform body collider respawn="pos: 0 10 -5">
  <!-- Entity respawns at 0,10,-5 when falling below Y=-100 -->
</entity>
```

### Imperative Usage

```typescript
import * as GAME from 'vibegame';

// Add respawn to an entity
const entity = state.createEntity();

// Set spawn point from current transform
state.addComponent(entity, GAME.Transform, {
  posX: 0, posY: 10, posZ: 0,
  eulerX: 0, eulerY: 0, eulerZ: 0
});

state.addComponent(entity, GAME.Respawn, {
  posX: 0, posY: 10, posZ: 0,
  eulerX: 0, eulerY: 0, eulerZ: 0
});

// Entity will respawn at (0,10,0) when falling
```

### Update Spawn Point

```typescript
import * as GAME from 'vibegame';

// Change respawn position dynamically
GAME.Respawn.posX[entity] = 20;
GAME.Respawn.posY[entity] = 5;
GAME.Respawn.posZ[entity] = -10;
```

### XML with Transform Sync

Position attributes automatically populate the respawn component:

```xml
<!-- Position sets both transform and respawn -->
<player pos="5 3 -2" euler="0 90 0"></player>
```
<!-- /LLM:EXAMPLES -->