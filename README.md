# VibeGame

A vibe coding 3D game engine with declarative HTML-like syntax, ECS architecture, and game-ready features including physics, rendering, and player controls out of the box.

## Quick Start

[**Try on JSFiddle**](https://jsfiddle.net/keLsxh5t/)

### Create a new project

```bash
npm create vibegame@latest my-game

cd my-game
bun dev
```

This scaffolds a complete project with `llms.txt` documentation for AI-assisted development.

### Or install directly

```bash
bun install vibegame
```

```html
<world canvas="#game-canvas" sky="#87ceeb">
  <!-- Ground -->
  <static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#90ee90"></static-part>

  <!-- Ball -->
  <dynamic-part pos="-2 4 -3" shape="sphere" size="1" color="#ff4500"></dynamic-part>
</world>

<canvas id="game-canvas"></canvas>

<script type="module">
  import * as GAME from 'vibegame';
  GAME.run();
</script>
```

## Problem

Vibe coding games works at first, but falls apart as the project grows.

## Solution

### 1. Context Management

Use [Shallot](https://github.com/dylanebert/shallot) to manage context across conversations:

- Use `/peel` at conversation start to load necessary context
- Use `/nourish` at conversation end to update context

### 2. ECS Architecture with Plugins

Live bevy, uses an Entity Component System architecture with Plugins:

- **Components**: Pure data structures without behavior
- **Systems**: Logic separated from data
- **Plugins**: Self-contained modules that bundle related functionality

### 3. Declarative XML Syntax

Entities and components defined declaratively in HTML:

```html
<world canvas="#game-canvas" sky="#87ceeb">
  <static-part pos="0 -0.5 0" shape="box" size="20 1 20"></static-part>
</world>
```

### 4. Roblox-like Abstraction

Game-ready features out of the box:

- Controllable character
- Physics simulation
- Camera controls
- Rendering pipeline
- Input handling

## Core Concepts

### World

All entities are defined within the `<world>` tag:

```html
<world canvas="#game-canvas" sky="#87ceeb">
  <!-- All entities and components here -->
</world>
```

### Basic Entities and Components

Entities and components can be defined with a CSS-like syntax:

```html
<world canvas="#game-canvas" sky="#87ceeb">
  <entity
    transform
    body="type: 1; pos: 0 -0.5 0"
    renderer="shape: box; size: 20 1 20; color: 0x90ee90"
    collider="shape: box; size: 20 1 20"
  ></entity>
</world>
```

or, with CSS-style shorthand expansion:

```html
<world canvas="#game-canvas" sky="#87ceeb">
  <entity
    transform
    renderer
    collider
    pos="0 -0.5 0"
    body="type: 1"
    shape="box"
    size="20 1 20"
    color="#90ee90"
  ></entity>
</world>
```

or, with recipes (entity-component bundles):

```html
<world canvas="#game-canvas" sky="#87ceeb">
  <static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#90ee90"></static-part>
</world>
```

### Custom Systems

Register custom systems and components to handle arbitrary game logic:

```html
<world canvas="#game-canvas" sky="#87ceeb">
  <static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#90ee90"></static-part>

  <!-- Entity with custom component -->
  <entity my-component="10"></entity>
</world>

<script type="module">
  import * as GAME from 'vibegame';

  const MyComponent = GAME.defineComponent({
    value: GAME.Types.f32,
  });

  const query = GAME.defineQuery([MyComponent]);

  const MySystem: GAME.System = {
    update: (state: GAME.State): void => {
      const entities: number[] = query(state.world);
      for (const entity of entities) {
        console.log("my-component value for entity", entity, "is", MyComponent.value[entity]);
        MyComponent.value[entity] += 1;
      }
    },
  };

  GAME.withComponent('my-component', MyComponent)
    .withSystem(MySystem)
    .run();
</script>
```

When registered, the custom component `MyComponent` will be automatically parsed from HTML with value `10`. The custom system `MySystem` will be automatically run every frame, which will query for every entity with `my-component` and increment its value by 1.

## Development

```bash
# Install dependencies
bun install

# Run example
bun run example

# Build library (fast, library only)
bun run build

# Build for release (includes docs & CDN)
bun run build:release

# Run tests
bun test
```

## Links

- [GitHub Repository](https://github.com/dylanebert/vibegame)
- [NPM Package](https://www.npmjs.com/package/vibegame)
- [Live Demo on JSFiddle](https://jsfiddle.net/zhLtd6e2/6/)
- [Shallot Context Manager](https://github.com/dylanebert/shallot)
