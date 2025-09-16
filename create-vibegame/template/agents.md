# VibeGame Engine System Prompt Context

VibeGame is a 3D game engine with declarative XML syntax and ECS architecture. This file provides essential context for AI agents working with the engine.

## Core Concepts

**ECS Architecture**: Entity-Component-System pattern where entities are IDs, components are data containers, and systems contain logic.

**Declarative XML**: Game entities defined in HTML-like syntax within `<world>` tags.

**Auto-Creation**: Engine automatically creates player, camera, and lighting if not explicitly defined.

## Essential Syntax

```xml
<world canvas="#game-canvas" sky="#87ceeb">
  <!-- Ground (REQUIRED to prevent player falling) -->
  <static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#90ee90"></static-part>

  <!-- Physics objects -->
  <dynamic-part pos="0 5 0" shape="sphere" size="1" color="#ff0000"></dynamic-part>
  <kinematic-part pos="5 2 0" shape="box" size="3 0.5 3" color="#0000ff">
    <tween target="body.pos-y" from="2" to="5" duration="3" loop="ping-pong"></tween>
  </kinematic-part>
</world>
```

## Key Recipes

- `<static-part>` - Immovable objects (grounds, walls, platforms)
- `<dynamic-part>` - Gravity-affected objects (balls, crates, debris)
- `<kinematic-part>` - Script-controlled physics (moving platforms, doors)
- `<player>` - Player character (auto-created if missing)
- `<camera>` - Orbital camera (auto-created if missing)
- `<entity>` - Base entity with any components via attributes

## Critical Physics Rule

⚠️ **Physics bodies override transform positions!** Always set position on the body, not the transform, for physics entities.

```xml
<!-- ✅ BEST: Use recipe with pos shorthand -->
<dynamic-part pos="0 5 0" shape="sphere" size="1"></dynamic-part>

<!-- ❌ WRONG: Transform position ignored if body exists -->
<entity transform="pos: 0 5 0" body collider></entity>
```

## Component System

Components declared as bare attributes (defaults) or with values:

```xml
<!-- Bare attributes use defaults -->
<entity transform body collider renderer></entity>

<!-- Override specific properties -->
<entity transform="pos: 0 5 0" body="type: dynamic; mass: 10" collider renderer></entity>
```

Shorthands automatically expand to matching component properties:
- `pos="x y z"` → applies to transform.pos* AND body.pos*
- `color="#ff0000"` → applies to renderer.color
- `size="2"` → broadcasts to sizeX, sizeY, sizeZ

## TypeScript API

```typescript
import * as GAME from 'vibegame';

// Component definition
const Health = GAME.defineComponent({
  current: GAME.Types.f32,
  max: GAME.Types.f32
});

// System with query
const healthQuery = GAME.defineQuery([Health]);
const HealthSystem: GAME.System = {
  update: (state) => {
    const entities = healthQuery(state.world);
    for (const entity of entities) {
      Health.current[entity] -= 1 * state.time.deltaTime;
    }
  }
};

// Plugin registration
GAME.withComponent('health', Health)
    .withSystem(HealthSystem)
    .run();
```

## Available Features

✅ **Core Systems**: Physics (Rapier 3D), rendering (Three.js), input (keyboard/mouse/gamepad), tweening, transforms

✅ **Game Elements**: Player controller, orbital camera, collision detection, respawn system, post-processing effects

❌ **Not Built-In**: Audio, multiplayer, save/load, inventory, AI/pathfinding, particles, custom shaders

## Development Commands

```bash
# Project creation
npm create vibegame@latest my-game
cd my-game

# Development
bun dev              # Start dev server
bun run build        # Production build
bun run check        # TypeScript validation
bun run lint --fix   # ESLint analysis
bun test             # Run tests
```

## Getting More Information

**Comprehensive Documentation**: Use Context7 to fetch detailed documentation with examples:

```typescript
// For AI agents with Context7 access:
// Use mcp__context7__resolve-library-id to find "vibegame"
// Then use mcp__context7__get-library-docs with the resolved ID
// This provides the full 2000+ line documentation with detailed examples
```

**Quick References**:
- Shapes: `box`, `sphere`, `cylinder`, `capsule`
- Physics Types: `static` (fixed), `dynamic` (gravity), `kinematic` (scripted)
- Easing: `linear`, `sine-in-out`, `quad-out`, `bounce-in`, etc.
- Loop Modes: `once`, `loop`, `ping-pong`

## Common Patterns

**Basic Platformer**: Ground + static platforms + player (auto-created)
**Physics Playground**: Ground + walls + dynamic objects with collision
**Moving Platforms**: Kinematic bodies + position tweening
**Collectibles**: Kinematic objects + rotation tweening + collision detection

## Best Practices for AI Development

1. **Always include ground** - Player falls without platforms
2. **Use recipes over raw entities** - Cleaner and more reliable
3. **Leverage auto-creation** - Engine handles player/camera/lighting defaults
4. **Physics position priority** - Set positions on bodies, not transforms
5. **Query Context7 for details** - This file is overview only, get specifics via Context7
6. **Test incrementally** - Start simple, add complexity progressively

## Architecture Notes

- **Plugin System**: Bevy-inspired modular architecture
- **Update Phases**: SetupBatch → FixedBatch → DrawBatch
- **Context Management**: Use /clear frequently in Claude Code sessions
- **Parallel Operations**: Invoke multiple tools simultaneously for efficiency

This context enables basic VibeGame development. For detailed API references, extensive examples, or advanced features, fetch comprehensive documentation via Context7.