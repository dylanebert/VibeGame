# ECS Module

<!-- LLM:OVERVIEW -->
Entity Component System scheduler and state management. Provides the State class for world management, system scheduling with execution phases, and plugin registration.
<!-- /LLM:OVERVIEW -->

## Purpose

- World state with entities and components
- System scheduling with execution phases
- Plugin registration and management
- Direct bitECS query usage (no abstraction)

## Layout

```
ecs/
├── context.md  # This file
├── components.ts  # Core ECS components
├── config.ts  # Configuration registry
├── constants.ts  # ECS constants and limits
├── ordering.ts  # System execution ordering
├── scheduler.ts  # Batch scheduler implementation
├── serialization.ts  # Component serialization
├── state.ts  # World state management
├── types.ts  # Core ECS types
├── utils.ts  # Component field utilities
└── index.ts  # Module exports
```

## Scope

- **In-scope**: ECS architecture, scheduling, state
- **Out-of-scope**: Specific components/systems

## Entry Points

- **state.ts**: State class for world management
- **scheduler.ts**: Scheduler for system batches
- **serialization.ts**: Component serialization utilities
- **types.ts**: Plugin, System, Component interfaces

## Dependencies

- **Internal**: None
- **External**: bitECS

## Execution Phases

### Frame Execution Flow

Each frame executes systems in three distinct phases:

1. **SetupBatch** (Once per frame)
   - Input gathering and processing
   - Frame state initialization
   - Runs exactly once at frame start

2. **FixedBatch** (0-N times per frame at 60Hz)
   - Physics simulation step
   - Gameplay logic requiring deterministic timing
   - Accumulates time and catches up if behind
   - Example: At 25 FPS runs 2x per frame, at 144 FPS runs ~0.4x per frame
   - Always uses `fixedDeltaTime` (1/60 second)

3. **DrawBatch** (Once per frame)
   - Rendering and visual updates
   - Interpolation between fixed updates
   - Runs exactly once at frame end
   - Uses variable `deltaTime` for smooth animations

<!-- LLM:REFERENCE -->
## API Reference

### Exported Classes

#### State
World container managing entities, components, systems, and plugins. See main core/context.md for full API.

### Exported Functions

- `serializeComponent(component, eid)` - Serialize component to JSON object
- `deserializeComponent(component, eid, data)` - Deserialize JSON into component

### Exported Constants

- `NULL_ENTITY: 4294967295` - Invalid entity ID
- `TIME_CONSTANTS.FIXED_TIMESTEP: 1/50` - Fixed update rate (20ms)
- `TIME_CONSTANTS.DEFAULT_DELTA: 1/144` - Default frame delta

### Exported Types

- `System` - System definition interface
- `Plugin` - Plugin bundle interface
- `Recipe` - Entity recipe definition
- `Config` - Configuration interface
- `GameTime` - Time tracking interface (deltaTime, fixedDeltaTime, elapsed, tick)
- `Parser` - XML tag parser function type
- `ComponentDefaults` - Default values mapping
- `ComponentEnums` - Enum value mappings
- `ShorthandMapping` - Attribute shorthand
- `ValidationRule` - Validation rule interface
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### System Execution Order

```typescript
import * as GAME from 'vibegame';

const EarlySystem: GAME.System = {
  group: 'setup',
  first: true,
  update: (state) => { /* runs first in setup */ }
};

const LateSystem: GAME.System = {
  group: 'draw',
  last: true,
  update: (state) => { /* runs last in draw */ }
};

const OrderedSystem: GAME.System = {
  after: [OtherSystem],
  before: [AnotherSystem],
  update: (state) => { /* runs between systems */ }
};
```
<!-- /LLM:EXAMPLES -->
