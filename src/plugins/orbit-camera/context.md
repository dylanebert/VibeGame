# Orbit Camera Plugin

<!-- LLM:OVERVIEW -->
Standalone orbital camera controller with direct input handling for third-person views and smooth target following.
<!-- /LLM:OVERVIEW -->

## Purpose

- Orbital camera movement around target
- Direct mouse/scroll input handling
- Smooth camera interpolation
- Independent camera control (no player dependency)

## Layout

```
orbit-camera/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # OrbitCamera component
├── systems.ts  # OrbitCameraInputSystem, OrbitCameraSystem
├── recipes.ts  # Camera recipes
├── operations.ts  # Camera operations
├── constants.ts  # Camera constants
└── math.ts  # Camera math utilities
```

## Scope

- **In-scope**: Orbital camera controls, smooth following
- **Out-of-scope**: First-person camera, fixed cameras

## Entry Points

- **plugin.ts**: OrbitCameraPlugin definition
- **systems.ts**: OrbitCameraInputSystem, OrbitCameraSystem
- **recipes.ts**: camera recipe

## Dependencies

- **Internal**: Core ECS, input plugin, transforms plugin
- **External**: Three.js Camera

## Components

- **OrbitCamera**: Camera configuration, state, and sensitivity

## Systems

- **OrbitCameraInputSystem**: Handles mouse look and scroll zoom from InputState
- **OrbitCameraSystem**: Updates camera position/rotation around target

## Recipes

- **orbitCamera**: Default orbital camera setup

<!-- LLM:REFERENCE -->
### Components

#### OrbitCamera
- target: eid (0) - Target entity to orbit around
- input-source: eid (0) - Entity with InputState component (player or self)
- current-yaw: f32 (0) - Current horizontal angle
- current-pitch: f32 (π/6) - Current vertical angle
- current-distance: f32 (4) - Current distance
- target-yaw: f32 (0) - Target horizontal angle
- target-pitch: f32 (π/6) - Target vertical angle
- target-distance: f32 (4) - Target distance
- min-distance: f32 (1)
- max-distance: f32 (25)
- min-pitch: f32 (0)
- max-pitch: f32 (π/2)
- smoothness: f32 (0.5) - Interpolation speed
- offset-x: f32 (0)
- offset-y: f32 (1.25)
- offset-z: f32 (0)
- sensitivity: f32 (0.007) - Mouse look sensitivity
- zoom-sensitivity: f32 (1.5) - Scroll zoom sensitivity

### Systems

#### OrbitCameraInputSystem
- Group: simulation
- Reads InputState from inputSource entity (player or camera)
- Updates camera yaw/pitch/distance based on mouse and scroll input
- Auto-detects inputSource if camera has InputState but no source set

#### OrbitCameraSystem
- Group: draw
- Smoothly interpolates camera to target values
- Calculates and updates camera position around target

### Recipes

#### camera
- Creates orbital camera with input handling
- Components: orbit-camera, transform, main-camera, input-state
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Camera

```xml
<!-- Create default orbital camera -->
<camera />
```

### Camera Following Player

```xml
<world>
  <!-- Player entity -->
  <player id="player" pos="0 0 0" />
  
  <!-- Camera following player -->
  <camera 
    target="#player"
    target-distance="10"
    min-distance="5"
    max-distance="20"
    offset-y="2"
  />
</world>
```

### Custom Orbit Settings

```xml
<entity 
  orbit-camera="
    target: #boss;
    target-distance: 15;
    target-yaw: 0;
    target-pitch: 0.5;
    smoothness: 0.2;
    offset-y: 3
  "
  transform
  main-camera
/>
```

### Standalone Camera (No Player)

```typescript
import * as GAME from 'vibegame';
import { InputPlugin, InputState } from 'vibegame/input';
import { OrbitCamera, OrbitCameraPlugin } from 'vibegame/orbit-camera';
import { Transform } from 'vibegame/transforms';

const InitSystem: GAME.System = {
  group: 'setup',
  setup: (state) => {
    const target = state.createEntity();
    state.addComponent(target, Transform);

    const camera = state.createEntity();
    state.addComponent(camera, OrbitCamera);
    state.addComponent(camera, Transform);
    state.addComponent(camera, InputState);
    OrbitCamera.target[camera] = target;
    OrbitCamera.inputSource[camera] = camera; // Camera reads its own input
  },
};

GAME
  .withoutDefaultPlugins()
  .withPlugins(InputPlugin, OrbitCameraPlugin)
  .run();
```

### Dynamic Target Switching

```typescript
import * as GAME from 'vibegame';
import { OrbitCamera } from 'vibegame/orbit-camera';

// Switch camera target
const switchTarget = (state, cameraEntity, newTargetEntity) => {
  OrbitCamera.target[cameraEntity] = newTargetEntity;
};
```
<!-- /LLM:EXAMPLES -->
