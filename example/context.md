# Example Application

<!-- LLM:OVERVIEW -->
Demo application showcasing the VibeGame game engine features. Use this as a reference for integrating the engine into your own projects or testing engine capabilities with hot-reload development.
<!-- /LLM:OVERVIEW -->

## Purpose

- Demonstrate engine capabilities
- Test plugin integrations
- Provide usage examples
- Development playground

## Layout

```
example/
├── context.md  # This file
├── index.html  # HTML entry point
├── package.json  # Example dependencies
└── vite.config.ts  # Vite configuration
```

## Scope

- **In-scope**: Demo scenes, feature showcase
- **Out-of-scope**: Production code, tests

## Entry Points

- **index.html**: Browser entry point

## Dependencies

- **Internal**: Full engine with all plugins
- **External**: Vite, Three.js

## Features Demonstrated

- XML-based entity creation
- Physics simulation
- Player movement
- Orbital camera
- Tween animations
- Dynamic entity spawning

## Running

```bash
bun run example
```

Opens development server with hot reload

<!-- LLM:EXAMPLES -->
## Examples

### Running the Demo

```bash
# Install dependencies
bun install

# Run the example application
bun run example
```

### Basic Integration

```typescript
// example/src/main.ts
import * as GAME from 'vibegame';

// Create engine with default plugins
const engine = GAME.builder()
  .withPlugins(GAME.DefaultPlugins)
  .withCanvas('#game')
  .build();

// Load XML scene
const sceneXML = `
  <world clear-color="#87ceeb">
    <ambient-light intensity="0.5"></ambient-light>
    <directional-light directional="dir: 1 -1 1"></directional-light>
    
    <entity transform="pos: 0 10 20" main-camera orbit-camera></entity>
    
    <player transform="pos: 0 1 0"></player>
    
    <entity transform="pos: 0 -0.5 0" 
            renderer="shape: box; size: 20 1 20; color: 0x808080"
            body="type: fixed">
    </entity>
  </world>
`;

engine.loadXML(sceneXML);
engine.start();
```

### Custom Scene Setup

```typescript
// Adding entities programmatically
import * as GAME from 'vibegame';

const MyCustomSystem = {
  id: 'my-custom-system',
  setup: (state) => {
    // Create entity with components
    const entity = state.createEntity();
    state.addComponent(entity, GAME.Transform);
    state.addComponent(entity, GAME.Renderer);
    
    // Set component values
    GAME.Transform.posY[entity] = 5;
    GAME.Renderer.shape[entity] = 1; // sphere
    GAME.Renderer.color[entity] = 0xff0000; // red
  }
};

// Add custom system to engine
const engine = GAME.builder()
  .withPlugins(GAME.DefaultPlugins)
  .withSystem(MyCustomSystem)
  .build();
```

### Hot Module Replacement

```typescript
// Vite config enables HMR
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    engine.stop();
  });
}
```
<!-- /LLM:EXAMPLES -->
