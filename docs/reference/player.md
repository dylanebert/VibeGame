# Player Reference

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

### Systems

#### PlayerMovementSystem
- Group: fixed
- Handles movement, rotation, and jumping from input

#### PlayerGroundedSystem
- Group: fixed
- Tracks grounded state and jump availability

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