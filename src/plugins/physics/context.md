# Physics Plugin

<!-- LLM:OVERVIEW -->
3D physics with Rapier: rigid bodies, collisions, character controllers. Body position is authoritative (overrides Transform).
<!-- /LLM:OVERVIEW -->

## Key Behavior

- **Body → Transform sync**: Physics position overwrites transform each frame
- **Fixed timestep**: Runs at 50Hz, may run 0-N times per frame
- **Platform sticking**: Characters inherit velocity from kinematic platforms
- **Initialization delay**: Bodies created on next fixed update after entity creation

<!-- LLM:REFERENCE -->
### Enums

**BodyType**: Dynamic (0), Fixed (1), KinematicPositionBased (2), KinematicVelocityBased (3)
**ColliderShape**: Box (0), Sphere (1)

### Components

**Body** - Physics body
- type: ui8 (Fixed), mass: f32 (1), gravityScale: f32 (1)
- posX/Y/Z, rotX/Y/Z/W, velX/Y/Z: f32
- eulerX/Y/Z: f32 (degrees shorthand)

**Collider** - Collision shape
- shape: ui8 (Box), sizeX/Y/Z: f32 (1), radius: f32 (0.5)
- friction: f32 (0.5), restitution: f32 (0), isSensor: ui8 (0)

**CharacterController** - Player physics
- grounded: ui8, platform: eid, platformVelX/Y/Z: f32
- offset: f32 (0.08), maxSlope: f32 (45°), snapDist: f32 (0.5)

**CharacterMovement** - Movement input
- desiredVelX/Y/Z, velocityY, actualMoveX/Y/Z: f32

**Force/Impulse** (one-shot, auto-removed)
- ApplyForce, ApplyImpulse, ApplyTorque: x, y, z (f32)
- SetLinearVelocity, KinematicMove: x, y, z (f32)

**Collision Events**
- TouchedEvent: other (eid) - collision started
- TouchEndedEvent: other (eid) - collision ended

### Recipes

- `static-part` - Fixed body (grounds, walls)
- `dynamic-part` - Gravity-affected (balls, crates)
- `kinematic-part` - Script-controlled (platforms)
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
### XML Usage

```xml
<!-- Static ground -->
<static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#808080"></static-part>

<!-- Dynamic ball -->
<dynamic-part pos="0 5 0" shape="sphere" size="1" restitution="0.8"></dynamic-part>

<!-- Moving platform -->
<kinematic-part name="lift" pos="0 2 0" shape="box" size="3 0.5 3"></kinematic-part>
<tween target="lift" attr="body.pos-y" from="2" to="5" duration="3"></tween>
```

### TypeScript

```typescript
import { Body, Collider, BodyType, ApplyImpulse, TouchedEvent } from 'vibegame/physics';

// Apply jump impulse
state.addComponent(entity, ApplyImpulse, { x: 0, y: 50, z: 0 });

// Collision detection
const touchedQuery = GAME.defineQuery([TouchedEvent]);
for (const entity of touchedQuery(state.world)) {
  console.log(`${entity} collided with ${TouchedEvent.other[entity]}`);
}

// Character movement
CharacterMovement.desiredVelX[entity] = input.x * 5;
if (CharacterController.grounded[entity]) CharacterMovement.velocityY[entity] = 10;
```
<!-- /LLM:EXAMPLES -->
