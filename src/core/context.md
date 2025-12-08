# Core Module

<!-- LLM:OVERVIEW -->
ECS foundation: State management, XML parsing, plugin architecture, scheduling.
<!-- /LLM:OVERVIEW -->

## Execution Model

1. **SetupBatch**: Input, frame init (once/frame)
2. **FixedBatch**: Physics at 50Hz (0-N times/frame, catches up if behind)
3. **DrawBatch**: Rendering with interpolation (once/frame)

<!-- LLM:REFERENCE -->
### State Class

**Entity Management**
- `createEntity(): number`
- `destroyEntity(eid)`, `exists(eid): boolean`
- `setEntityName(name, eid)`, `getEntityByName(name): number | null`

**Components**
- `addComponent(eid, Component, values?)`
- `removeComponent(eid, Component)`
- `hasComponent(eid, Component): boolean`
- `getComponent(name): Component | undefined`

**Registration**
- `registerPlugin(plugin)`, `registerSystem(system)`
- `registerRecipe(recipe)`, `registerConfig(config)`

**Runtime**
- `step(deltaTime?)`, `dispose()`
- `time.deltaTime`, `time.fixedDeltaTime`, `time.elapsed`

### Types

**System**
- update/setup/dispose?: (state) => void
- group?: 'setup' | 'simulation' | 'fixed' | 'draw'
- first?, last?, before?, after?: ordering

**Plugin**
- systems?, recipes?, components?, config?

**Config**
- parsers?, defaults?, shorthands?, enums?, validations?, adapters?

### bitECS Exports
- `defineComponent(schema)`, `defineQuery(components[])`
- `Types` - f32, i32, ui8, eid, etc.
- `addComponent`, `removeComponent`, `hasComponent`

### Constants
- `NULL_ENTITY: 4294967295`
- `FIXED_TIMESTEP: 1/50`
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```typescript
// Define component and query
const Health = GAME.defineComponent({ current: GAME.Types.f32, max: GAME.Types.f32 });
const healthQuery = GAME.defineQuery([Health]);

// System
const DamageSystem: GAME.System = {
  group: 'simulation',
  update: (state) => {
    for (const eid of healthQuery(state.world)) {
      Health.current[eid] -= 10 * state.time.deltaTime;
    }
  }
};

// Plugin
const HealthPlugin: GAME.Plugin = {
  components: { Health },
  systems: [DamageSystem],
  config: { defaults: { health: { current: 100, max: 100 } } }
};

state.registerPlugin(HealthPlugin);
```
<!-- /LLM:EXAMPLES -->
