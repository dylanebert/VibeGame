# Physics Examples

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

const touchedQuery = GAME.defineQuery([GAME.TouchedEvent]);
const CollisionSystem: GAME.System = {
  update: (state) => {
    // Query entities with collision events
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