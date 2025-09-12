# Physics Plugin

<!-- LLM:OVERVIEW -->
3D physics simulation with Rapier including rigid bodies, collisions, and character controllers.
<!-- /LLM:OVERVIEW -->

## Physics Behavior

### Transform Synchronization
- **Body position is authoritative**: For entities with a Body component, the physics position/rotation overwrites Transform values
- **One-way sync**: Body → Transform (never Transform → Body except via teleportation)
- **Initialization delay**: Rapier bodies aren't created until the next fixed update after entity creation

### Fixed Timestep Execution
- **Fixed update rate**: Physics runs at 60Hz (1/60 second intervals), not every frame
- **Variable execution**: May run 0-N times per frame depending on performance
  - High FPS (144Hz): Multiple frames between physics updates
  - Low FPS (30Hz): Multiple physics updates per frame
- **Interpolation**: InterpolatedTransform smooths visual movement between physics steps

### Example Timing
```
144 FPS: Frame--Frame--[Physics]--Frame--Frame--[Physics]
 30 FPS: Frame--[Physics][Physics]--Frame--[Physics][Physics]
```

## Layout

```
physics/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # Physics components
├── systems.ts  # Physics systems
├── recipes.ts  # Pre-configured physics entities
└── utils.ts  # Physics utilities
```

## Scope

- **In-scope**: Rigid body physics, collision detection, character controllers, forces/impulses
- **Out-of-scope**: Soft body physics, fluids, particles, cloth simulation

## Entry Points

- **plugin.ts**: PhysicsPlugin definition with all systems and configuration
- **systems.ts**: Physics simulation systems
- **index.ts**: Public API exports including initializePhysics()

## Dependencies

- **Internal**: Core ECS, Transform components
- **External**: @dimforge/rapier3d-compat (WASM physics engine)

<!-- LLM:REFERENCE -->
### Constants

- DEFAULT_GRAVITY: -60

### Enums

#### BodyType
- Dynamic = 0 - Affected by forces
- Fixed = 1 - Immovable static
- KinematicPositionBased = 2 - Script position
- KinematicVelocityBased = 3 - Script velocity

#### ColliderShape
- Box = 0
- Sphere = 1
- Capsule = 2

### Components

#### PhysicsWorld
- gravityX: f32 (0)
- gravityY: f32 (-60)
- gravityZ: f32 (0)

#### Body
- type: ui8 - BodyType enum (Fixed)
- mass: f32 (1)
- linearDamping: f32 (0)
- angularDamping: f32 (0)
- gravityScale: f32 (1)
- ccd: ui8 (0)
- lockRotX: ui8 (0)
- lockRotY: ui8 (0)
- lockRotZ: ui8 (0)
- posX, posY, posZ: f32
- rotX, rotY, rotZ, rotW: f32 (rotW=1)
- eulerX, eulerY, eulerZ: f32
- velX, velY, velZ: f32
- rotVelX, rotVelY, rotVelZ: f32

#### Collider
- shape: ui8 - ColliderShape enum (Box)
- sizeX, sizeY, sizeZ: f32 (1)
- radius: f32 (0.5)
- height: f32 (1)
- friction: f32 (0.5)
- restitution: f32 (0)
- density: f32 (1)
- isSensor: ui8 (0)
- membershipGroups: ui16 (0xffff)
- filterGroups: ui16 (0xffff)
- posOffsetX, posOffsetY, posOffsetZ: f32
- rotOffsetX, rotOffsetY, rotOffsetZ, rotOffsetW: f32 (rotOffsetW=1)

#### CharacterController
- offset: f32 (0.08)
- maxSlope: f32 (45°)
- maxSlide: f32 (30°)
- snapDist: f32 (0.5)
- autoStep: ui8 (1)
- maxStepHeight: f32 (0.3)
- minStepWidth: f32 (0.05)
- upX, upY, upZ: f32 (upY=1)
- moveX, moveY, moveZ: f32
- grounded: ui8

#### CharacterMovement
- desiredVelX, desiredVelY, desiredVelZ: f32
- velocityY: f32
- actualMoveX, actualMoveY, actualMoveZ: f32

#### InterpolatedTransform
- prevPosX, prevPosY, prevPosZ: f32
- prevRotX, prevRotY, prevRotZ, prevRotW: f32
- posX, posY, posZ: f32
- rotX, rotY, rotZ, rotW: f32

#### Force/Impulse Components
- ApplyForce: x, y, z (f32)
- ApplyTorque: x, y, z (f32)
- ApplyImpulse: x, y, z (f32)
- ApplyAngularImpulse: x, y, z (f32)
- SetLinearVelocity: x, y, z (f32)
- SetAngularVelocity: x, y, z (f32)
- KinematicMove: x, y, z (f32)
- KinematicRotate: x, y, z, w (f32)

#### Collision Events
- CollisionEvents: activeEvents (ui8)
- TouchedEvent: other, handle1, handle2 (ui32)
- TouchEndedEvent: other, handle1, handle2 (ui32)

### Systems

- PhysicsWorldSystem - Initializes physics world
- PhysicsInitializationSystem - Creates bodies and colliders
- CharacterMovementSystem - Character controller movement
- PhysicsCleanupSystem - Removes physics on entity destroy
- CollisionEventCleanupSystem - Clears collision events
- ApplyForcesSystem - Applies forces
- ApplyTorquesSystem - Applies torques
- ApplyImpulsesSystem - Applies impulses
- ApplyAngularImpulsesSystem - Applies angular impulses
- SetVelocitySystem - Sets velocities
- TeleportationSystem - Instant position changes
- KinematicMovementSystem - Kinematic movement
- PhysicsStepSystem - Steps simulation
- PhysicsRapierSyncSystem - Syncs Rapier to ECS
- PhysicsInterpolationSystem - Interpolates for rendering

### Functions

#### initializePhysics(): Promise<void>
Initializes Rapier WASM physics engine

### Recipes

- static-part - Immovable physics objects
- dynamic-part - Gravity-affected objects
- kinematic-part - Script-controlled objects
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Usage

#### XML Recipes

##### Static Floor
```xml
<static-part
  pos="0 -0.5 0"
  shape="box"
  size="20 1 20"
  color="#90ee90"
/>
```

##### Dynamic Ball
```xml
<dynamic-part
  pos="0 5 0"
  shape="sphere"
  radius="0.5"
  color="#ff0000"
  mass="2"
  restitution="0.8"
/>
```

##### Moving Platform
```xml
<kinematic-part
  pos="0 2 0"
  shape="box"
  size="3 0.2 3"
  color="#4169e1"
>
  <!-- Add movement with tweening -->
  <tween
    target="body.pos-y"
    from="2"
    to="5"
    duration="3"
    ease="sine-in-out"
    loop="ping-pong"
  />
</kinematic-part>
```

##### Character with Controller
```xml
<entity
  pos="0 1 0"
  body="type: kinematic-position"
  collider="shape: capsule; height: 1.8; radius: 0.4"
  character-controller
  character-movement
  transform
  renderer
/>
```

#### JavaScript API

##### Create Physics Entity
```typescript
import * as GAME from 'vibegame';

// Create a dynamic physics box
const entity = state.createEntity();

state.addComponent(entity, GAME.Body, {
  type: GAME.BodyType.Dynamic,
  mass: 5,
  posX: 0, posY: 10, posZ: 0
});

state.addComponent(entity, GAME.Collider, {
  shape: GAME.ColliderShape.Box,
  sizeX: 1, sizeY: 1, sizeZ: 1,
  friction: 0.7,
  restitution: 0.3
});

// Note: Physics body won't exist until next fixed update
// Transform will be overwritten by Body position after initialization
```

##### Moving Physics Bodies

```typescript
import * as GAME from 'vibegame';

// Dynamic bodies - Use forces/impulses for movement
if (GAME.Body.type[entity] === GAME.BodyType.Dynamic) {
  // Apply force for gradual acceleration
  state.addComponent(entity, GAME.ApplyForce, { x: 10, y: 0, z: 0 });
  
  // Apply impulse for instant velocity change
  state.addComponent(entity, GAME.ApplyImpulse, { x: 0, y: 50, z: 0 });
  
  // Direct position setting only for teleportation
  GAME.Body.posX[entity] = 10; // Teleport - use sparingly
}

// Kinematic bodies - Direct control via movement components
if (GAME.Body.type[entity] === GAME.BodyType.KinematicPositionBased) {
  state.addComponent(entity, GAME.KinematicMove, { x: 5, y: 2, z: 0 });
}

if (GAME.Body.type[entity] === GAME.BodyType.KinematicVelocityBased) {
  state.addComponent(entity, GAME.SetLinearVelocity, { x: 3, y: 0, z: 0 });
}

// Never modify Transform directly for physics entities
// GAME.Transform.posX[entity] = 10; // ❌ Will be overwritten by Body
```

##### Apply Forces
```typescript
import * as GAME from 'vibegame';

// Apply upward impulse (jump)
state.addComponent(entity, GAME.ApplyImpulse, {
  x: 0, y: 50, z: 0
});

// Apply continuous force
state.addComponent(entity, GAME.ApplyForce, {
  x: 10, y: 0, z: 0
});

// Set velocity directly
state.addComponent(entity, GAME.SetLinearVelocity, {
  x: 0, y: 5, z: 0
});
```

##### Handle Collisions
```typescript
import * as GAME from 'vibegame';

const CollisionSystem: GAME.System = {
  update: (state) => {
    // Query entities with collision events
    const touchedQuery = GAME.defineQuery([GAME.TouchedEvent]);
    for (const entity of touchedQuery(state.world)) {
      const otherEntity = GAME.TouchedEvent.other[entity];
      console.log(`Entity ${entity} collided with ${otherEntity}`);
      
      // React to collision
      state.addComponent(entity, GAME.ApplyImpulse, {
        x: 0, y: 10, z: 0
      });
    }
  }
};
```

##### Character Movement
```typescript
import * as GAME from 'vibegame';

const PlayerMovementSystem: GAME.System = {
  update: (state) => {
    const movementQuery = GAME.defineQuery([GAME.CharacterMovement, GAME.CharacterController]);
    for (const entity of movementQuery(state.world)) {
      // Set desired movement based on input
      GAME.CharacterMovement.desiredVelX[entity] = input.x * 5;
      GAME.CharacterMovement.desiredVelZ[entity] = input.z * 5;
      
      // Jump if grounded
      if (GAME.CharacterController.grounded[entity] && input.jump) {
        GAME.CharacterMovement.velocityY[entity] = 10;
      }
    }
  }
};
```

##### Custom Plugin Integration
```typescript
import * as GAME from 'vibegame';

// Initialize physics before running
await GAME.initializePhysics();

// Use with builder
GAME
  .withPlugin(GAME.PhysicsPlugin)
  .run();
```
<!-- /LLM:EXAMPLES -->
