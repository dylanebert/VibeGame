# Player Plugin

<!-- LLM:OVERVIEW -->
Complete player character controller with physics movement, jumping, and platform momentum preservation.
<!-- /LLM:OVERVIEW -->

## Purpose

- Player character movement and physics
- Jump mechanics with momentum preservation from moving platforms
- Input-driven character control
- Camera target for orbit camera

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

- **PlayerMovementSystem**: Input to movement

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
- cameraSensitivity: f32 (0.007)
- cameraZoomSensitivity: f32 (1.5)
- cameraEntity: eid (0)
- inheritedVelX: f32 (0) - Horizontal momentum inherited from platform
- inheritedVelZ: f32 (0) - Horizontal momentum inherited from platform

### Systems

#### PlayerMovementSystem
- Group: fixed
- Handles movement, rotation, jumping with platform momentum preservation

#### PlayerGroundedSystem
- Group: fixed
- Tracks grounded state, jump availability, and clears inherited momentum on landing

#### PlayerCameraLinkingSystem
- Group: simulation
- Links player to orbit camera

#### PlayerCameraControlSystem
- Group: simulation
- Camera control via mouse input

### Recipes

#### player
- Complete player setup with physics
- Components: player, character-movement, transform, world-transform, body, collider, character-controller, input-state, respawn

### Functions

#### processInput(moveForward, moveRight, cameraYaw): Vector3
Converts input to world-space movement

#### handleJump(entity, jumpPressed, currentTime): number
Processes jump with buffering

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
    camera-sensitivity="0.005"
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
    // Create player entity
    const player = state.createEntity();
    
    // Add player recipe components
    state.addComponent(player, GAME.Player, {
      speed: 7,
      jumpHeight: 3.5,
      cameraSensitivity: 0.01
    });
    
    // Add required components
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

**Mouse:**
- Right-click + drag - Rotate camera
- Scroll wheel - Zoom in/out

### Plugin Registration

```typescript
import * as GAME from 'vibegame';

GAME
  .withPlugin(GAME.PlayerPlugin)  // Included in defaults
  .run();
```
<!-- /LLM:EXAMPLES -->
