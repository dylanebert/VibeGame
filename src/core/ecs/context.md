# ECS Module

<!-- LLM:OVERVIEW -->
State management, system scheduling, plugin registration. See core/context.md for full API.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Execution Phases
1. **SetupBatch** - Input, frame init (once/frame)
2. **FixedBatch** - Physics at 50Hz (0-N times/frame)
3. **DrawBatch** - Rendering (once/frame)

### Constants
- `NULL_ENTITY: 4294967295`
- `FIXED_TIMESTEP: 1/50`

### Types
- System, Plugin, Recipe, Config, GameTime, Parser, Adapter
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```typescript
const EarlySystem: GAME.System = { group: 'setup', first: true, update: (state) => {} };
const OrderedSystem: GAME.System = { after: [OtherSystem], before: [AnotherSystem], update: (state) => {} };
```
<!-- /LLM:EXAMPLES -->
