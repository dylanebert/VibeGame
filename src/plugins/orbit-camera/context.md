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
- **systems.ts**: OrbitCameraSetupSystem, OrbitCameraInputSystem, OrbitCameraSystem
- **recipes.ts**: orbit-camera recipe

## Dependencies

- **Internal**: Core ECS, input plugin, transforms plugin
- **External**: Three.js Camera

## Components

- **OrbitCamera**: Camera configuration, state, and sensitivity

## Systems

- **OrbitCameraInputSystem**: Handles mouse look and scroll zoom from InputState
- **OrbitCameraSystem**: Updates camera position/rotation around target

## Recipes

- **orbit-camera**: Default orbital camera setup

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

#### OrbitCameraSetupSystem
- Group: setup
- Auto-creates target entity at origin if target is unassigned (eid 0)
- Auto-assigns inputSource from existing InputState entity, or creates one if none found

#### OrbitCameraInputSystem
- Group: simulation
- Reads InputState from inputSource entity (player or camera)
- Updates camera yaw/pitch/distance based on mouse and scroll input

#### OrbitCameraSystem
- Group: draw
- Smoothly interpolates camera to target values
- Calculates and updates camera position around target

### Recipes

#### orbit-camera
- Creates orbital camera with auto-setup for target and input handling
- Components: orbit-camera, transform, main-camera
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Camera

```xml
<orbit-camera />
```

### Camera Following Player

```xml
<world>
  <player id="player" pos="0 0 0" />
  <orbit-camera
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

### Dynamic Target Switching

```typescript
import { OrbitCamera } from 'vibegame/orbit-camera';

const switchTarget = (state, cameraEntity, newTargetEntity) => {
  OrbitCamera.target[cameraEntity] = newTargetEntity;
};
```
<!-- /LLM:EXAMPLES -->
