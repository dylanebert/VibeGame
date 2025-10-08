# Source Code

<!-- LLM:OVERVIEW -->
Entry point for VibeGame, a 3D game engine using ECS architecture with bitECS. Provides builder pattern API for configuration, runtime engine for execution, and plugin system for extensibility.
<!-- /LLM:OVERVIEW -->

## Purpose

- Engine core with ECS foundation
- Plugin system with standard plugins
- Modern builder pattern API
- Vite plugin for WASM physics setup

## Layout

```
src/
├── context.md  # This file
├── core/  # Engine foundation (ECS, XML, math)
│   └── context.md
├── plugins/  # Plugin modules
│   ├── animation/
│   ├── input/
│   ├── networking/  # Colyseus multiplayer (opt-in)
│   ├── orbit-camera/
│   ├── physics/
│   ├── player/
│   ├── recipes/
│   ├── rendering/
│   ├── respawn/
│   ├── startup/
│   ├── transforms/
│   ├── tweening/
│   └── defaults.ts  # Default plugin bundle
├── server/  # Colyseus server runtime
│   ├── context.md
│   └── index.ts
├── vite/  # Vite plugin
│   └── index.ts
├── builder.ts  # Builder pattern API
├── runtime.ts  # Game runtime engine
└── index.ts  # Package entry with namespace exports
```

## Scope

- **In-scope**: Core ECS, plugin system, game API
- **Out-of-scope**: Application code, examples

## Entry Points

- **index.ts**: Main package export with namespace API
- **builder.ts**: Builder pattern implementation
- **runtime.ts**: Runtime engine
- **core/index.ts**: Core types and utilities
- **plugins/*/index.ts**: Individual plugin exports
- **server/index.ts**: Colyseus server creation

## Dependencies

- **Internal**: Core modules, plugin system
- **External**: bitECS, Three.js, Rapier 3D

## Plugin System

Plugins follow standard structure:
- `index.ts` - Public exports
- `plugin.ts` - Plugin definition
- `components.ts` - Data definitions
- `systems.ts` - Logic systems
- `recipes.ts` - XML entity recipes
- `utils.ts` - Helper functions

See [layers/structure.md](../layers/structure.md) for complete plugin architecture

<!-- LLM:REFERENCE -->
## API Reference

### Builder Functions

Global functions for configuring and running a game:

- `withPlugin(plugin: Plugin)` - Add a plugin to the game
- `withoutDefaultPlugins()` - Exclude all default plugins
- `withoutPlugins(...plugins: Plugin[])` - Exclude specific default plugins
- `withSystem(system: System)` - Add a custom system
- `withComponent(name: string, component: Component)` - Register a named component
- `configure(options: BuilderOptions)` - Set configuration options
- `run(): Promise<Runtime>` - Build and start the game

All builder functions return a builder instance for method chaining.

#### BuilderOptions

- `canvas?: string` - Canvas selector for rendering
- `autoStart?: boolean` - Auto-start animation loop (default: true)
- `dom?: boolean` - Process DOM for <world> elements (default: true)

### Runtime Interface

The runtime returned by `run()`:

- `start(): Promise<void>` - Initialize and start the game loop
- `stop(): void` - Stop the game loop
- `step(deltaTime?: number): void` - Advance one frame
- `getState(): State` - Get the ECS state

### Core Exports

#### bitECS Re-exports
- `defineComponent(schema: ComponentSchema): Component` - Define an ECS component
- `Types` - Data types for component properties (f32, ui8, etc.)
- `addComponent(world, entity, Component, values?)` - Add component to entity
- `removeComponent(world, entity, Component)` - Remove component from entity
- `hasComponent(world, entity, Component): boolean` - Check if entity has component

#### Custom Types
- `State` - ECS world state with query and entity management
- `Plugin` - Plugin interface with components, systems, recipes, config
- `System` - System interface with setup/update/cleanup hooks
- `Component` - bitECS component type
- `Recipe` - Entity template definition
- `Config` - Plugin configuration with defaults, parsers, validators

#### Utilities
- `XMLParser` - Parse XML elements for entity creation
- `lerp(a, b, t)` - Linear interpolation
- `slerp(qa, qb, t)` - Spherical linear interpolation (quaternions)
- `toCamelCase(str)` - Convert kebab-case to camelCase
- `toKebabCase(str)` - Convert camelCase to kebab-case

### Vite Plugin

```typescript
import { vibegame } from 'vibegame/vite';

// Returns Vite plugin for WASM physics setup
vibegame(): Plugin[]
```

### Default Plugins

Available via `DefaultPlugins` export:
- `RecipePlugin` - XML recipe parsing
- `TransformsPlugin` - Position, rotation, scale
- `RenderingPlugin` - Three.js rendering
- `PhysicsPlugin` - Rapier 3D physics
- `InputPlugin` - Keyboard, mouse, gamepad
- `AnimationPlugin` - Animation mixer
- `TweenPlugin` - Tweening system
- `OrbitCameraPlugin` - Orbital camera
- `PlayerPlugin` - Character controller
- `StartupPlugin` - Initialization
- `RespawnPlugin` - Entity respawning

### Networking (Opt-in)

Multiplayer support via Colyseus:
- `NetworkingPlugin` - Client-side networking (from `vibegame/networking`)
- `createGameServer()` - Server creation (from `vibegame/server`)
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Usage

```typescript
import * as GAME from 'vibegame';

// Simple setup with defaults
GAME.run();
```

### Custom Configuration

```typescript
import * as GAME from 'vibegame';
import { MyCustomPlugin } from './my-plugin';

// Exclude all defaults and use specific plugins
GAME.withoutDefaultPlugins()
  .withPlugin(GAME.RenderingPlugin)
  .withPlugin(GAME.PhysicsPlugin)
  .withPlugin(MyCustomPlugin)
  .configure({
    canvas: '#game-canvas',
    autoStart: true
  })
  .run();

// Keep defaults but exclude specific plugins
GAME.withoutPlugins(GAME.AnimationPlugin, GAME.PostprocessingPlugin)
  .withPlugin(MyCustomPlugin)
  .run();
```

### Manual Runtime Control

```typescript
import * as GAME from 'vibegame';

// Configure without auto-start
const runtime = await GAME
  .withPlugin(CustomPlugin)
  .withSystem(CustomSystem)
  .withComponent('health', HealthComponent)
  .configure({ 
    canvas: '#game',
    autoStart: false 
  })
  .run();

// Manual control
runtime.step(); // Step with default delta time
runtime.step(GAME.TIME_CONSTANTS.FIXED_TIMESTEP); // Step with fixed timestep
runtime.start(); // Start animation loop
runtime.stop(); // Stop animation loop
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { vibegame } from 'vibegame/vite';

export default defineConfig({
  plugins: [vibegame()]
});
```

### Custom Plugin

```typescript
import * as GAME from 'vibegame';

const MyComponent = GAME.defineComponent({
  value: GAME.Types.f32
});

const myComponentQuery = GAME.defineQuery([MyComponent]);

const MySystem: GAME.System = {
  update: (state) => {
    const entities = myComponentQuery(state.world);
    for (const eid of entities) {
      MyComponent.value[eid] += state.time.delta;
    }
  }
};

const MyPlugin: GAME.Plugin = {
  components: { MyComponent },
  systems: [MySystem],
  config: {
    defaults: { MyComponent: { value: 0 } }
  }
};
```
<!-- /LLM:EXAMPLES -->
