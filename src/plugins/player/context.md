# Player Plugin

<!-- LLM:OVERVIEW -->
Complete player character controller with physics movement, jumping, and platform momentum preservation.
<!-- /LLM:OVERVIEW -->

## Purpose

- Player character movement and physics
- Jump mechanics with momentum preservation from moving platforms
- Input-driven character control
- Camera-relative movement using orbit camera orientation

## Layout

```
player/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # Player, Jumper components
├── systems.ts  # PlayerMovementSystem
├── recipes.ts  # Player recipes
├── utils.ts  # Movement utilities
└── constants.ts  # Movement constants
```

## Scope

- **In-scope**: Player movement, jumping, input handling
- **Out-of-scope**: AI characters, NPCs

## Entry Points

- **plugin.ts**: PlayerPlugin definition
- **systems.ts**: PlayerMovementSystem
- **recipes.ts**: player recipe

## Dependencies

- **Internal**: Physics, input, transforms
- **External**: Rapier character controller

## Components

- **Player**: Player marker and config
- **Jumper**: Jump state and configuration

## Systems

- **PlayerMovementSystem**: Camera-relative input to movement
- **PlayerGroundedSystem**: Platform tracking and momentum management
- **PlayerCameraLinkingSystem**: Links player to camera and sets camera inputSource

## Recipes

- **player**: Complete player setup with physics

<!-- LLM:REFERENCE -->
### Components

#### Player
- speed: f32 (5.3)
- jumpHeight: f32 (2.3)
- rotationSpeed: f32 (10)
- canJump: ui8 (1)
- isJumping: ui8 (0)
- jumpCooldown: f32 (0)
- lastGroundedTime: f32 (0)
- jumpBufferTime: f32 (-10000)
- cameraEntity: eid (0) - Linked camera for orientation reference
- inheritedVelX: f32 (0) - Horizontal momentum from platform
- inheritedVelZ: f32 (0) - Horizontal momentum from platform
- inheritedAngVelX: f32 (0) - Platform angular velocity X
- inheritedAngVelY: f32 (0) - Platform angular velocity Y
- inheritedAngVelZ: f32 (0) - Platform angular velocity Z
- platformOffsetX: f32 (0) - Position relative to platform center
- platformOffsetY: f32 (0) - Position relative to platform center
- platformOffsetZ: f32 (0) - Position relative to platform center
- lastPlatform: eid (0) - Track platform changes

### Systems

#### PlayerMovementSystem
- Group: fixed
- Reads camera yaw for camera-relative movement
- Handles rotation, jumping with platform momentum inheritance

#### PlayerGroundedSystem
- Group: fixed
- Tracks grounded state and platform changes
- Clears momentum on landing

#### PlayerCameraLinkingSystem
- Group: simulation
- Auto-links player to first available camera
- Sets camera target and inputSource to player entity

### Recipes

#### player
- Complete player setup with physics
- Components: player, character-movement, transform, world-transform, body, collider, character-controller, input-state, respawn

### Functions

#### processInput(moveForward, moveRight, cameraYaw): Vector3
Converts input to world-space movement

#### calculateTangentialVelocity(angVelX, angVelY, angVelZ, offsetX, offsetY, offsetZ): Vector3
Computes tangential velocity from angular rotation (v = ω × r)

#### handleJump(entity, jumpPressed, currentTime, platform?): number
Processes jump with buffering and angular momentum inheritance

#### updateRotation(entity, inputVector, deltaTime, rotationData): Quaternion
Smooth rotation towards movement
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Player Usage (XML)

```xml
<world>
  <!-- Player auto-created if not specified -->
  <player pos="0 2 0" speed="6" jump-height="3" />
</world>
```

### Custom Player Configuration (XML)

```xml
<world>
  <player
    pos="5 1 -10"
    speed="8"
    jump-height="4"
    rotation-speed="15"
  />
</world>
```

### Accessing Player Component (JavaScript)

```typescript
import * as GAME from 'vibegame';

const playerQuery = GAME.defineQuery([GAME.Player]);
const MySystem: GAME.System = {
  update: (state) => {
    const players = playerQuery(state.world);
    for (const entity of players) {
      // Check if player is jumping
      if (GAME.Player.isJumping[entity]) {
        console.log('Player is airborne!');
      }
      
      // Modify player speed
      GAME.Player.speed[entity] = 10;
    }
  }
};
```

### Creating Player Programmatically

```typescript
import * as GAME from 'vibegame';

const PlayerSpawnSystem: GAME.System = {
  setup: (state) => {
    const player = state.createEntity();

    state.addComponent(player, GAME.Player, {
      speed: 7,
      jumpHeight: 3.5,
    });

    state.addComponent(player, GAME.Transform, { posY: 5 });
    state.addComponent(player, GAME.Body, { type: GAME.BodyType.KinematicPositionBased });
    state.addComponent(player, GAME.CharacterController);
    state.addComponent(player, GAME.InputState);
  }
};
```

### Movement Controls

**Keyboard:**
- W/S or Arrow Up/Down - Move forward/backward
- A/D or Arrow Left/Right - Move left/right 
- Space - Jump

**Mouse (via orbit camera):**
- Right-click + drag - Rotate camera
- Scroll wheel - Zoom in/out

Note: Camera controls are handled by OrbitCameraPlugin, not PlayerPlugin.

### Plugin Registration

```typescript
import * as GAME from 'vibegame';

GAME
  .withPlugin(GAME.PlayerPlugin)  // Included in defaults
  .run();
```
<!-- /LLM:EXAMPLES -->
