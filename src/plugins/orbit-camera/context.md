# Orbit Camera Plugin

<!-- LLM:OVERVIEW -->
Orbital camera controller for third-person views and smooth target following.
<!-- /LLM:OVERVIEW -->

## Purpose

- Orbital camera movement around target
- Smooth camera interpolation
- Mouse/touch orbit controls
- Zoom and pan support

## Layout

```
orbit-camera/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # OrbitCamera component
├── systems.ts  # OrbitCameraSystem
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
- **systems.ts**: OrbitCameraSystem for updates
- **recipes.ts**: orbitCamera recipe

## Dependencies

- **Internal**: Core ECS, input, transforms
- **External**: Three.js Camera

## Components

- **OrbitCamera**: Camera configuration and state

## Systems

- **OrbitCameraSystem**: Updates camera position/rotation

## Recipes

- **orbitCamera**: Default orbital camera setup

<!-- LLM:REFERENCE -->
### Components

#### OrbitCamera
- target: eid (0) - Target entity ID
- current-yaw: f32 (π) - Current horizontal angle
- current-pitch: f32 (π/6) - Current vertical angle
- current-distance: f32 (4) - Current distance
- target-yaw: f32 (π) - Target horizontal angle
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

### Systems

#### OrbitCameraSystem
- Group: draw
- Updates camera position and rotation around target

### Recipes

#### camera
- Creates orbital camera with default settings
- Components: orbit-camera, transform, world-transform, main-camera
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

### Programmatic Usage

```typescript
import * as GAME from 'vibegame';

const CameraControlSystem = {
  update: (state) => {
    const cameraQuery = GAME.defineQuery([GAME.OrbitCamera]);
    const cameras = cameraQuery(state.world);
    
    for (const camera of cameras) {
      // Rotate camera on input
      if (state.input.mouse.deltaX) {
        GAME.OrbitCamera.targetYaw[camera] += state.input.mouse.deltaX * 0.01;
      }
      
      // Zoom on scroll
      if (state.input.mouse.wheel) {
        GAME.OrbitCamera.targetDistance[camera] = Math.max(
          GAME.OrbitCamera.minDistance[camera],
          Math.min(
            GAME.OrbitCamera.maxDistance[camera],
            GAME.OrbitCamera.targetDistance[camera] - state.input.mouse.wheel * 0.5
          )
        );
      }
    }
  }
};
```

### Dynamic Target Switching

```typescript
import * as GAME from 'vibegame';

// Switch camera target
const switchTarget = (state, cameraEntity, newTargetEntity) => {
  GAME.OrbitCamera.target[cameraEntity] = newTargetEntity;
};
```
<!-- /LLM:EXAMPLES -->