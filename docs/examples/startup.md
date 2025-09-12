# Startup Examples

## Examples

### Basic Usage (Auto-Creation)

```typescript
// The plugin automatically creates defaults when included
import * as GAME from 'vibegame';

// This will create player, camera, and lighting automatically
GAME.run(); // Uses DefaultPlugins which includes StartupPlugin
```

### Preventing Auto-Creation with XML

```xml
<world>
  <!-- Creating your own player prevents auto-creation -->
  <player pos="10 2 -5" speed="12" />
  
  <!-- Creating custom lighting prevents default lights -->
  <entity ambient="sky-color: 0xff0000" directional />
</world>
```

### Manual Plugin Registration

```typescript
import * as GAME from 'vibegame';

// Use startup plugin without other defaults
GAME.withoutDefaultPlugins()
  .withPlugin(GAME.TransformsPlugin)
  .withPlugin(GAME.RenderingPlugin) 
  .withPlugin(GAME.StartupPlugin)
  .run();
```

### System Behavior

The startup systems are idempotent - they check for existing entities before creating:

```typescript
import * as GAME from 'vibegame';

// First run: Creates player, camera, lights
const playerQuery = GAME.defineQuery([GAME.Player]);
playerQuery(state.world).length // 0 -> creates player

// Subsequent runs: Skips creation
playerQuery(state.world).length // 1 -> skips creation
```