# Core Module

<!-- LLM:OVERVIEW -->
Entity Component System foundation with State management and plugin architecture.
<!-- /LLM:OVERVIEW -->

## Purpose

- ECS scheduler and state management
- XML parser for declarative entity creation
- Runtime validation for XML recipes
- Math utilities for 3D transformations
- Core types and interfaces

## Layout

```
core/
├── context.md  # This file
├── ecs/  # Entity Component System
│   ├── context.md
│   ├── constants.ts
│   ├── ordering.ts  # System execution order
│   ├── scheduler.ts  # Batch scheduling
│   ├── state.ts  # World state
│   ├── types.ts  # Core types
│   └── index.ts
├── xml/  # XML parsing
│   ├── context.md
│   ├── parser.ts  # Main parser
│   ├── traverser.ts  # DOM traversal
│   ├── types.ts  # XML types
│   ├── values.ts  # Value parsing
│   └── index.ts
├── validation/  # Recipe validation
│   ├── context.md
│   ├── schemas.ts  # Zod validation schemas
│   ├── parser.ts  # Runtime validation
│   ├── error-formatter.ts  # Error messages
│   ├── types.ts  # TypeScript types
│   └── index.ts
├── math/  # Math utilities
│   ├── context.md
│   ├── utilities.ts
│   └── index.ts
├── utils/  # Core utilities
│   ├── naming.ts
│   ├── logger.ts  # Structured logging
│   └── index.ts
└── index.ts  # Core exports
```

## Scope

- **In-scope**: ECS foundation, XML parsing, recipe validation, math, core types
- **Out-of-scope**: Game logic, rendering, physics

## Entry Points

- **index.ts**: Core exports (State, Plugin, System, Component types)
- **ecs/scheduler.ts**: System scheduling and batches
- **xml/parser.ts**: XML to ECS entity conversion

## Dependencies

- **Internal**: None (foundation layer)
- **External**: bitECS, Three.js types

## Key Concepts

- **State**: Central world state managing entities/components
- **Plugin**: Bundle of systems, components, recipes
- **System**: Logic that operates on component queries
- **Scheduler**: Manages SetupBatch, FixedBatch, DrawBatch

### Execution Model

The engine uses a semi-fixed timestep model with three execution phases:

1. **SetupBatch**: Runs once per frame for input and frame setup
2. **FixedBatch**: Runs at 50Hz fixed intervals (may run 0-N times per frame)
   - Catches up if behind: multiple steps on slow frames
   - Waits if ahead: skips steps on fast frames
3. **DrawBatch**: Runs once per frame for rendering with interpolation

<!-- LLM:REFERENCE -->
### State Class

#### Methods

- createEntity(): number
- destroyEntity(eid: number): void
- exists(eid: number): boolean
- addComponent(eid, component, values?): void
- removeComponent(eid, component): void
- hasComponent(eid, component): boolean
- registerPlugin(plugin): void
- registerSystem(system): void
- registerRecipe(recipe): void
- registerComponent(name, component): void
- registerConfig(config): void
- getRecipe(name): Recipe | undefined
- getComponent(name): Component | undefined
- getParser(tag): Parser | undefined
- setEntityName(name, entity): void
- getEntityByName(name): number | null
- step(deltaTime?): void
- dispose(): void

#### Properties

- world: IWorld
- time: GameTime
- scheduler: Scheduler
- systems: Set<System>
- config: ConfigRegistry

### Types

#### System
- update?: (state) => void
- setup?: (state) => void
- dispose?: (state) => void
- group?: 'setup' | 'simulation' | 'fixed' | 'draw'
- first?: boolean
- last?: boolean
- before?: System[]
- after?: System[]

#### Plugin
- systems?: System[]
- recipes?: Recipe[]
- components?: Record<string, Component>
- config?: Config

#### Recipe
- name: string
- components?: string[]
- overrides?: Record<string, number>

#### Config
- parsers?: Record<string, Parser>
- defaults?: Record<string, Record<string, number>>
- shorthands?: Record<string, Record<string, ShorthandMapping>>
- enums?: Record<string, Record<string, EnumMapping>>
- validations?: ValidationRule[]
- skip?: Record<string, string[]> - Properties to skip during component application
- adapters?: Record<string, Record<string, Adapter>> - Transform properties at parse time (e.g., set text content from string)

#### GameTime
- deltaTime: number
- fixedDeltaTime: number (1/50)
- elapsed: number

### Functions

#### XMLParser.parse(xmlString): XMLParseResult
Parses XML to element tree

#### toKebabCase(str): string
PascalCase to kebab-case

#### toCamelCase(str): string
kebab-case to camelCase

#### lerp(a, b, t): number
Linear interpolation

#### slerp(qa, qb, t): Quaternion
Quaternion interpolation

### Constants

- NULL_ENTITY: 4294967295
- FIXED_TIMESTEP: 1/50
- DEFAULT_DELTA: 1/144

### bitECS Exports

- defineComponent(schema): Component
- defineQuery(components[]): QueryFunction
- Types - f32, i32, ui8, etc.
- addComponent, removeComponent, hasComponent
- addEntity, removeEntity, createWorld
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Creating and Managing Entities

```typescript
import * as GAME from 'vibegame';

// Define a component
const Health = GAME.defineComponent({
  current: GAME.Types.f32,
  max: GAME.Types.f32
});

// Create state and entity
const state = new GAME.State();
const entity = state.createEntity();

// Add component with initial values
state.addComponent(entity, Health, {
  current: 100,
  max: 100
});

// Query entities with Health
const healthQuery = GAME.defineQuery([Health]);
const entities = healthQuery(state.world);
for (const eid of entities) {
  Health.current[eid] -= 10; // Direct array access
}

// Remove component and entity
state.removeComponent(entity, Health);
state.destroyEntity(entity);
```

### Defining Systems

```typescript
import * as GAME from 'vibegame';
// Gameplay logic in fixed timestep (consistent simulation)
const PhysicsSystem = {
  group: 'fixed',
  update: (state) => {
    // Runs at 50Hz regardless of framerate
    // Use state.time.fixedDeltaTime (always 1/50)
    velocity += gravity * state.time.fixedDeltaTime;
  }
};

// Visual updates in draw phase (every frame)
const RenderSystem = {
  group: 'draw',
  update: (state) => {
    // Runs once per frame
    // Use state.time.deltaTime for frame-dependent animations
    particleAlpha -= fadeRate * state.time.deltaTime;
  }
};

// Input handling in setup phase
const InputSystem = {
  group: 'setup',
  first: true, // Run first in setup
  update: (state) => {
    // Gather input before other systems
  }
};

state.registerSystem(PhysicsSystem);
state.registerSystem(RenderSystem);
state.registerSystem(InputSystem);
```

### Creating Plugins

```typescript
import * as GAME from 'vibegame';
const HealthPlugin: GAME.Plugin = {
  components: { Health },
  systems: [DamageSystem, RegenerationSystem],
  recipes: [{
    name: 'enemy',
    components: ['health', 'transform'],
    overrides: { 'health.max': 50 }
  }],
  config: {
    defaults: {
      health: { current: 100, max: 100 }
    },
    enums: {
      health: {
        difficulty: { easy: 50, normal: 100, hard: 200 }
      }
    }
  }
};

state.registerPlugin(HealthPlugin);
```

### Parsing XML

```typescript
import * as GAME from 'vibegame';

const xml = `
  <world>
    <entity transform="pos: 0 5 0" health="max: 100"></entity>
  </world>
`;

const result = GAME.XMLParser.parse(xml);
// result.root contains ParsedElement tree

// Custom parser for a tag
const customParser: GAME.Parser = ({ entity, element, state }) => {
  const pos = element.attributes.pos as { x: number; y: number; z: number };
  state.addComponent(entity, GAME.Transform, {
    posX: pos.x, posY: pos.y, posZ: pos.z
  });
};

state.registerConfig({
  parsers: { 'my-tag': customParser }
});
```
<!-- /LLM:EXAMPLES -->
