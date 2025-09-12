# Physics Reference

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