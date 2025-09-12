# Orbit Camera Examples

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