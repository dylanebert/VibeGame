# VibeGame

A 3D game engine with declarative XML syntax and ECS architecture. Start playing immediately with automatic player, camera, and lighting - just add a ground to prevent falling.

## Instant Playable Game

```html
<script src="https://cdn.jsdelivr.net/npm/vibegame@latest/dist/cdn/vibegame.standalone.iife.js"></script>

<world canvas="#game-canvas" sky="#87ceeb">
  <!-- Ground (REQUIRED to prevent player falling) -->
  <static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#90ee90"></static-part>
</world>

<canvas id="game-canvas"></canvas>
<script>
  GAME.run();
</script>
```

This creates a complete game with:
- ✅ Player character (auto-created)
- ✅ Orbital camera (auto-created)
- ✅ Directional + ambient lighting (auto-created)
- ✅ Ground platform (you provide this)
- ✅ WASD movement, mouse camera, space to jump

## Development Setup

After installation with `npm create vibegame@latest my-game`:

```bash
cd my-game
bun dev    # Start dev server with hot reload
```

### Project Structure
- **TypeScript** - Full TypeScript support with strict type checking
- **src/main.ts** - Entry point for your game
- **index.html** - HTML template with canvas element
- **vite.config.ts** - Build configuration

### Commands
- `bun dev` - Development server with hot reload
- `bun run build` - Production build
- `bun run preview` - Preview production build
- `bun run check` - TypeScript type checking
- `bun run lint` - Lint code with ESLint
- `bun run format` - Format code with Prettier
- `bun run update` - Update llms.txt after upgrading vibegame

## Physics Objects

```xml
<world canvas="#game-canvas">
  <!-- 1. Static: Never moves (grounds, walls, platforms) -->
  <static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#808080"></static-part>
  
  <!-- 2. Dynamic: Falls with gravity (balls, crates, debris) -->
  <dynamic-part pos="0 5 0" shape="sphere" size="1" color="#ff0000"></dynamic-part>
  
  <!-- 3. Kinematic: Script-controlled movement (moving platforms, doors) -->
  <kinematic-part pos="5 2 0" shape="box" size="3 0.5 3" color="#0000ff">
    <!-- Animate the platform up and down -->
    <tween target="body.pos-y" from="2" to="5" duration="3" loop="ping-pong"></tween>
  </kinematic-part>
</world>
```

## CRITICAL: Physics Position vs Transform Position

<warning>
⚠️ **Physics bodies override transform positions!** 
Always set position on the body, not the transform, for physics entities.
</warning>

```xml
<!-- ✅ BEST: Use recipe with pos shorthand -->
<dynamic-part pos="0 5 0" shape="sphere" size="1"></dynamic-part>

<!-- ❌ WRONG: Transform position ignored if body exists -->
<entity transform="pos: 0 5 0" body collider></entity>  <!-- Falls to 0,0,0! -->

<!-- ✅ CORRECT: Set body position explicitly (if using raw entity) -->
<entity transform body="pos: 0 5 0" collider></entity>
```

## ECS Architecture Explained

Unlike traditional game engines with GameObjects, VibeGame uses Entity-Component-System:

- **Entities**: Just numbers (IDs), no data or behavior
- **Components**: Pure data containers (position, health, color)
- **Systems**: Functions that process entities with specific components

```typescript
// Component = Data only
const Health = GAME.defineComponent({
  current: GAME.Types.f32,
  max: GAME.Types.f32
});

// System = Logic only
const healthQuery = GAME.defineQuery([Health]);
const DamageSystem: GAME.System = {
  update: (state) => {
    const entities = healthQuery(state.world);
    for (const entity of entities) {
      Health.current[entity] -= 1 * state.time.delta;
      if (Health.current[entity] <= 0) {
        state.destroyEntity(entity);
      }
    }
  }
};
```

## What's Auto-Created (Game Engine Defaults)

The engine automatically creates these if missing:
1. **Player** - Character with physics, controls, and respawn (at 0, 1, 0)
2. **Camera** - Orbital camera following the player
3. **Lighting** - Ambient + directional light with shadows

You only need to provide:
- **Ground/platforms** - Or the player falls forever
- **Game objects** - Whatever makes your game unique

### Override Auto-Creation (When Needed)

While auto-creation is recommended, you can manually create these for customization:

```xml
<world canvas="#game-canvas">
  <static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#90ee90"></static-part>
  
  <!-- Custom player spawn position and properties -->
  <player pos="0 10 0" speed="8" jump-height="3"></player>
  
  <!-- Custom camera settings -->
  <camera orbit-camera="distance: 10; target-pitch: 0.5"></camera>
  
  <!-- Custom lighting (or use <light> for both ambient + directional) -->
  <ambient-light sky-color="#ff6b6b" ground-color="#4ecdc4" intensity="0.8"></ambient-light>
  <directional-light color="#ffffff" intensity="0.5" direction="-1 -2 -1"></directional-light>
</world>
```

**Best Practice**: Use auto-creation unless you specifically need custom positions, properties, or multiple instances. The defaults are well-tuned for most games.

## Common Game Patterns

### Basic Platformer
```xml
<world canvas="#game-canvas">
  <!-- Ground -->
  <static-part pos="0 -0.5 0" shape="box" size="50 1 50" color="#90ee90"></static-part>
  
  <!-- Platforms at different heights -->
  <static-part pos="-5 2 0" shape="box" size="3 0.5 3" color="#808080"></static-part>
  <static-part pos="0 4 0" shape="box" size="3 0.5 3" color="#808080"></static-part>
  <static-part pos="5 6 0" shape="box" size="3 0.5 3" color="#808080"></static-part>
  
  <!-- Moving platform -->
  <kinematic-part pos="0 3 5" shape="box" size="4 0.5 4" color="#4169e1">
    <tween target="body.pos-x" from="-10" to="10" duration="5" loop="ping-pong"></tween>
  </kinematic-part>
  
  <!-- Goal area -->
  <static-part pos="10 8 0" shape="box" size="5 0.5 5" color="#ffd700"></static-part>
</world>
```

### Collectible Coins (Collision-based)
```xml
<world canvas="#game-canvas">
  <static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#90ee90"></static-part>
  
  <!-- Spinning coins -->
  <kinematic-part pos="2 1 0" shape="cylinder" size="0.5 0.1 0.5" color="#ffd700">
    <tween target="body.euler-y" from="0" to="360" duration="2" loop="loop"></tween>
  </kinematic-part>
  
  <kinematic-part pos="-2 1 0" shape="cylinder" size="0.5 0.1 0.5" color="#ffd700">
    <tween target="body.euler-y" from="0" to="360" duration="2" loop="loop"></tween>
  </kinematic-part>
</world>
```

### Physics Playground
```xml
<world canvas="#game-canvas">
  <!-- Ground -->
  <static-part pos="0 -0.5 0" shape="box" size="30 1 30" color="#90ee90"></static-part>
  
  <!-- Walls -->
  <static-part pos="15 5 0" shape="box" size="1 10 30" color="#808080"></static-part>
  <static-part pos="-15 5 0" shape="box" size="1 10 30" color="#808080"></static-part>
  <static-part pos="0 5 15" shape="box" size="30 10 1" color="#808080"></static-part>
  <static-part pos="0 5 -15" shape="box" size="30 10 1" color="#808080"></static-part>
  
  <!-- Spawn balls at different positions -->
  <dynamic-part pos="-5 10 0" shape="sphere" size="1" color="#ff0000"></dynamic-part>
  <dynamic-part pos="0 12 0" shape="sphere" size="1.5" color="#00ff00"></dynamic-part>
  <dynamic-part pos="5 8 0" shape="sphere" size="0.8" color="#0000ff"></dynamic-part>
  
  <!-- Bouncy ball (high restitution) -->
  <dynamic-part pos="0 15 5" shape="sphere" size="1" color="#ff00ff" 
                collider="restitution: 0.9"></dynamic-part>
</world>
```

## Recipe Reference

| Recipe | Purpose | Key Attributes | Common Use |
|--------|---------|---------------|------------|
| `<static-part>` | Immovable objects | `pos`, `shape`, `size`, `color` | Grounds, walls, platforms |
| `<dynamic-part>` | Gravity-affected objects | `pos`, `shape`, `size`, `color`, `mass` | Balls, crates, falling objects |
| `<kinematic-part>` | Script-controlled physics | `pos`, `shape`, `size`, `color` | Moving platforms, doors |
| `<player>` | Player character | `pos`, `speed`, `jump-height` | Main character (auto-created) |
| `<entity>` | Base entity | Any components via attributes | Custom entities |

### Shape Options
- `box` - Rectangular solid (default)
- `sphere` - Ball shape
- `cylinder` - Cylindrical shape
- `capsule` - Pill shape (good for characters)

### Size Attribute
- Box: `size="width height depth"` or `size="2 1 2"`
- Sphere: `size="diameter"` or `size="1"`
- Cylinder: `size="diameter height"` or `size="1 2"`
- Broadcast: `size="2"` becomes `size="2 2 2"`

## How Recipes and Shorthands Work

### Everything is an Entity
Every XML tag creates an entity. Recipes like `<static-part>` are just shortcuts for `<entity>` with preset components.

```xml
<!-- These are equivalent: -->
<static-part pos="0 0 0" color="#ff0000"></static-part>

<entity 
  transform 
  body="type: fixed" 
  collider 
  renderer="color: 0xff0000"
  pos="0 0 0"></entity>
```

### Component Attributes
Components are declared using bare attributes (no value means "use defaults"):

```xml
<!-- Bare attributes declare components with default values -->
<entity transform body collider renderer></entity>

<!-- Add properties to override defaults -->
<entity transform="pos-x: 5; pos-y: 2; pos-z: -3; scale: 2"></entity>

<!-- Mix bare and valued attributes -->
<entity transform="pos: 0 5 0" body="type: dynamic; mass: 10" collider renderer></entity>

<!-- Property groups -->
<entity transform="pos: 5 2 -3; scale: 2 2 2"></entity>
```

**Important**: Bare attributes like `transform` mean "include this component with default values", NOT "empty" or "disabled".

### Automatic Shorthand Expansion
Shorthands expand to ANY component with matching properties:

```xml
<!-- "pos" shorthand applies to components with posX, posY, posZ -->
<entity transform body pos="0 5 0"></entity>
<!-- Both transform AND body get pos values -->

<!-- "color" shorthand applies to renderer.color -->
<entity renderer color="#ff0000"></entity>  

<!-- "size" shorthand (broadcasts single value) -->
<entity collider size="2"></entity>
<!-- Expands to: sizeX: 2, sizeY: 2, sizeZ: 2 -->

<!-- Multiple shorthands together -->
<entity transform body collider renderer pos="0 5 0" size="1" color="#ff0000"></entity>
```

### Recipe Internals
Recipes are registered component bundles with defaults:

```xml
<!-- What <dynamic-part> actually is: -->
<entity 
  transform
  body="type: dynamic"     <!-- Override -->
  collider
  renderer
  respawn
></entity>

<!-- So this: -->
<dynamic-part pos="0 5 0" color="#ff0000"></dynamic-part>

<!-- Is really: -->
<entity 
  transform="pos: 0 5 0"
  body="type: dynamic; pos: 0 5 0"  <!-- pos applies to body too! -->
  collider
  renderer="color: 0xff0000"
  respawn
></entity>
```

### Common Pitfall: Component Requirements
```xml
<!-- ❌ BAD: Missing required components -->
<entity pos="0 5 0"></entity>  <!-- No transform component! -->

<!-- ✅ GOOD: Explicit components -->
<entity transform="pos: 0 5 0"></entity>

<!-- ✅ BEST: Use recipe with built-in components -->
<static-part pos="0 5 0"></static-part>
```

### Best Practices Summary
1. **Use recipes** (`<static-part>`, `<dynamic-part>`, etc.) instead of raw `<entity>` tags
2. **Use shorthands** (`pos`, `size`, `color`) for cleaner code
3. **Override only what you need** - recipes have good defaults
4. **Mix recipes with custom components** - e.g., `<dynamic-part health="max: 100">`

## Currently Supported Features

### ✅ What Works Well
- **Basic platforming** - Jump puzzles, obstacle courses
- **Physics interactions** - Balls, dominoes, stacking
- **Moving platforms** - Via kinematic bodies + tweening
- **Collectibles** - Using collision detection in systems
- **Third-person character control** - WASD + mouse camera
- **Gamepad support** - Xbox/PlayStation controllers
- **Visual effects** - Tweening colors, positions, rotations

### Example Prompts That Work
- "Create a platformer with moving platforms and collectible coins"
- "Make bouncing balls that collide with walls"
- "Build an obstacle course with rotating platforms"
- "Add falling crates that stack up"
- "Create a simple parkour level"

## Features Not Yet Built-In

### ❌ Engine Features Not Available
- **Multiplayer/Networking** - No server sync
- **Sound/Audio** - No audio system yet
- **Save/Load** - No persistence system
- **Inventory** - No item management
- **Dialog/NPCs** - No conversation system
- **AI/Pathfinding** - No enemy AI
- **Particles** - No particle effects
- **Custom shaders** - Fixed rendering pipeline
- **Terrain** - Use box platforms instead

### ✅ Available Through Web Platform
- **UI/HUD** - Use standard HTML/CSS overlays on the canvas
- **Animations** - GSAP is included for advanced UI animations
- **Score display** → HTML elements positioned over canvas
- **Menus** → Standard web UI (divs, buttons, etc.)

### Recommended Approaches
- **UI** → Position HTML elements over the canvas with CSS
- **Animations** → Use GSAP for smooth UI transitions
- **Level progression** → Reload with different XML or hide/show worlds
- **Enemy behavior** → Tweened movement patterns
- **Interactions** → Collision detection in custom systems

## Common Mistakes to Avoid

### ❌ Forgetting the Ground
```xml
<!-- BAD: No ground, player falls forever -->
<world canvas="#game-canvas">
  <dynamic-part pos="0 5 0" shape="sphere"></dynamic-part>
</world>
```

### ❌ Setting Transform Position on Physics Objects
```xml
<!-- BAD: Transform position ignored -->
<entity transform="pos: 0 5 0" body collider></entity>

<!-- GOOD: Set body position (raw entity) -->
<entity transform body="pos: 0 5 0" collider></entity>

<!-- BEST: Use recipes with pos shorthand -->
<dynamic-part pos="0 5 0" shape="sphere"></dynamic-part>
```

### ❌ Missing World Tag
```xml
<!-- BAD: Entities outside world tag -->
<static-part pos="0 0 0" shape="box"></static-part>

<!-- GOOD: Everything inside world -->
<world canvas="#game-canvas">
  <static-part pos="0 0 0" shape="box"></static-part>
</world>
```

### ❌ Wrong Physics Type
```xml
<!-- BAD: Dynamic platform (falls with gravity) -->
<dynamic-part pos="0 3 0" shape="box">
  <tween target="body.pos-x" from="-5" to="5"></tween>
</dynamic-part>

<!-- GOOD: Kinematic for controlled movement -->
<kinematic-part pos="0 3 0" shape="box">
  <tween target="body.pos-x" from="-5" to="5"></tween>
</kinematic-part>
```

## Custom Components and Systems

### Creating a Health System
```typescript
import * as GAME from 'vibegame';

// Define the component
const Health = GAME.defineComponent({
  current: GAME.Types.f32,
  max: GAME.Types.f32
});

// Create the system
const HealthSystem: GAME.System = {
  update: (state) => {
    const entities = GAME.defineQuery([Health])(state.world);
    for (const entity of entities) {
      // Regenerate health over time
      if (Health.current[entity] < Health.max[entity]) {
        Health.current[entity] += 5 * state.time.delta;
      }
    }
  }
};

// Bundle as plugin
const HealthPlugin: GAME.Plugin = {
  components: { Health },
  systems: [HealthSystem],
  config: {
    defaults: {
      "health": { current: 100, max: 100 }
    }
  }
};

// Use in game
GAME.withPlugin(HealthPlugin).run();
```

### Using in XML
```xml
<world canvas="#game-canvas">
  <!-- Add health to a dynamic entity (best practice: use recipes) -->
  <dynamic-part pos="0 2 0" shape="sphere" color="#ff0000"
                health="current: 50; max: 100"></dynamic-part>
</world>
```

## State API Reference

Available in all systems via the `state` parameter:

### Entity Management
- `createEntity(): number` - Create new entity
- `destroyEntity(entity: number)` - Remove entity
- `query(...Components): number[]` - Find entities with components

### Component Operations  
- `addComponent(entity, Component, data?)` - Add component
- `removeComponent(entity, Component)` - Remove component
- `hasComponent(entity, Component): boolean` - Check component
- `getComponent(name: string): Component | null` - Get by name

### Time
- `time.delta: number` - Frame time in seconds
- `time.elapsed: number` - Total time in seconds
- `time.fixed: number` - Fixed timestep (1/50)

### Physics Helpers
- `addComponent(entity, ApplyImpulse, {x, y, z})` - One-time push
- `addComponent(entity, ApplyForce, {x, y, z})` - Continuous force
- `addComponent(entity, KinematicMove, {x, y, z})` - Move kinematic

## Plugin System

### Using Specific Plugins
```typescript
import * as GAME from 'vibegame';

// Start with no plugins
GAME
  .withoutDefaultPlugins()
  .withPlugin(TransformsPlugin)  // Just transforms
  .withPlugin(RenderingPlugin)   // Add rendering
  .withPlugin(PhysicsPlugin)     // Add physics
  .run();
```

### Default Plugin Bundle
- **RecipesPlugin** - XML parsing and entity creation
- **TransformsPlugin** - Position, rotation, scale, hierarchy
- **RenderingPlugin** - Three.js meshes, lights, camera
- **PhysicsPlugin** - Rapier physics simulation
- **InputPlugin** - Keyboard, mouse, gamepad input
- **OrbitCameraPlugin** - Third-person camera
- **PlayerPlugin** - Character controller
- **TweenPlugin** - Animation system
- **RespawnPlugin** - Fall detection and reset
- **StartupPlugin** - Auto-create player/camera/lights

## Module Documentation

### Core
Math utilities for interpolation and 3D transformations.

### Animation
Procedural character animation with body parts that respond to movement states.

### Input
Focus-aware input handling for mouse, keyboard, and gamepad with buffered actions. Keyboard input only responds when canvas has focus.

### Orbit Camera
Orbital camera controller for third-person views and smooth target following.

### Physics
3D physics simulation with Rapier including rigid bodies, collisions, and character controllers.

### Player
Complete player character controller with physics movement and jumping.

### Recipes
Foundation for declarative XML entity creation with parent-child hierarchies and attribute shorthands.

### Rendering
Three.js rendering pipeline with meshes, lights, and cameras.

### Respawn
Automatic respawn system that resets entities when falling below Y=-100.

### Startup
Auto-creates player, camera, and lighting entities at startup if missing.

### Transforms
3D transforms with position, rotation, scale, and parent-child hierarchies.

### Tweening
Animates component properties with easing functions and loop modes.

## Plugin Reference

### Core

### Functions

#### lerp(a, b, t): number
Linear interpolation

#### slerp(fromX, fromY, fromZ, fromW, toX, toY, toZ, toW, t): Quaternion
Quaternion spherical interpolation

### Animation

### Components

#### AnimatedCharacter
- headEntity: eid
- torsoEntity: eid
- leftArmEntity: eid
- rightArmEntity: eid
- leftLegEntity: eid
- rightLegEntity: eid
- phase: f32 - Walk cycle phase (0-1)
- jumpTime: f32
- fallTime: f32
- animationState: ui8 - 0=IDLE, 1=WALKING, 2=JUMPING, 3=FALLING, 4=LANDING
- stateTransition: f32

#### HasAnimator
Tag component (no properties)

### Systems

#### AnimatedCharacterInitializationSystem
- Group: setup
- Creates body part entities for AnimatedCharacter components

#### AnimatedCharacterUpdateSystem
- Group: simulation
- Updates character animation based on movement and physics state

### Input

### Components

#### InputState
- moveX: f32 - Horizontal axis (-1 left, 1 right)
- moveY: f32 - Forward/backward (-1 back, 1 forward)
- moveZ: f32 - Vertical axis (-1 down, 1 up)
- lookX: f32 - Mouse delta X
- lookY: f32 - Mouse delta Y
- scrollDelta: f32 - Mouse wheel delta
- jump: ui8 - Jump available (0/1)
- primaryAction: ui8 - Primary action (0/1)
- secondaryAction: ui8 - Secondary action (0/1)
- leftMouse: ui8 - Left button (0/1)
- rightMouse: ui8 - Right button (0/1)
- middleMouse: ui8 - Middle button (0/1)
- jumpBufferTime: f32
- primaryBufferTime: f32
- secondaryBufferTime: f32

### Systems

#### InputSystem
- Group: simulation
- Updates InputState components with current input data

### Functions

#### setTargetCanvas(canvas: HTMLCanvasElement | null): void
Registers canvas for focus-based keyboard input

#### consumeJump(): boolean
Consumes buffered jump input

#### consumePrimary(): boolean
Consumes buffered primary action

#### consumeSecondary(): boolean
Consumes buffered secondary action

#### handleMouseMove(event: MouseEvent): void
Processes mouse movement

#### handleMouseDown(event: MouseEvent): void
Processes mouse button press

#### handleMouseUp(event: MouseEvent): void
Processes mouse button release

#### handleWheel(event: WheelEvent): void
Processes mouse wheel

### Constants

#### INPUT_CONFIG
Default input mappings and sensitivity settings

### Orbit Camera

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

### Physics

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

### Player

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

### Recipes

### Components

#### Parent
- entity: i32 - Parent entity ID

### Functions

#### parseXMLToEntities(state, xmlContent): EntityCreationResult[]
Converts XML elements to ECS entities with hierarchy

#### createEntityFromRecipe(state, recipeName, attributes?): number
Creates entity from recipe with attributes

#### fromEuler(x, y, z): Quaternion
Converts Euler angles (radians) to quaternion

### Types

#### EntityCreationResult
- entity: number - Entity ID
- tagName: string - Recipe name
- children: EntityCreationResult[]

### Recipes

#### entity
- Base recipe with no default components

### Property Formats

- Single value: `transform="scale: 2"`
- Vector3: `transform="pos: 0 5 -3"`
- Broadcast: `transform="scale: 2"` → scale: 2 2 2
- Euler angles: `transform="euler: 0 45 0"` (degrees)
- Multiple: `transform="pos: 0 5 0; euler: 0 45 0"`
- Shorthands: `pos="0 5 0"` → transform component

### Rendering

### Components

#### Renderer
- shape: ui8 - 0=box, 1=sphere, 2=cylinder, 3=plane
- sizeX, sizeY, sizeZ: f32 (1)
- color: ui32 (0xffffff)
- visible: ui8 (1)

#### RenderContext
- clearColor: ui32 (0x000000)
- hasCanvas: ui8

#### MainCamera
Tag component (no properties)

#### Ambient
- skyColor: ui32 (0x87ceeb)
- groundColor: ui32 (0x4a4a4a)
- intensity: f32 (0.6)

#### Directional
- color: ui32 (0xffffff)
- intensity: f32 (1)
- castShadow: ui8 (1)
- shadowMapSize: ui32 (4096)
- directionX: f32 (-1)
- directionY: f32 (2)
- directionZ: f32 (-1)
- distance: f32 (30)

### Systems

#### MeshInstanceSystem
- Group: draw
- Synchronizes transforms with Three.js meshes

#### LightSyncSystem
- Group: draw
- Updates Three.js lights

#### CameraSyncSystem
- Group: draw
- Updates Three.js camera

#### WebGLRenderSystem
- Group: draw (last)
- Renders scene to canvas

### Functions

#### setCanvasElement(entity, canvas): void
Associates canvas with RenderContext

### Recipes

- ambient-light - Ambient hemisphere lighting
- directional-light - Directional light with shadows
- light - Both ambient and directional

### Respawn

### Components

#### Respawn
- posX, posY, posZ: f32 - Spawn position
- eulerX, eulerY, eulerZ: f32 - Spawn rotation (degrees)

### Systems

#### RespawnSystem
- Group: simulation
- Resets entities when Y < -100

### Startup

### Systems

#### LightingStartupSystem
- Group: setup
- Creates default lighting if none exists

#### CameraStartupSystem
- Group: setup
- Creates main camera if none exists

#### PlayerStartupSystem
- Group: setup
- Creates player entity if none exists

#### PlayerCharacterSystem
- Group: setup
- Adds animated character to players

### Transforms

### Components

#### Transform
- posX, posY, posZ: f32 (0)
- rotX, rotY, rotZ, rotW: f32 (rotW=1) - Quaternion
- eulerX, eulerY, eulerZ: f32 (0) - Degrees
- scaleX, scaleY, scaleZ: f32 (1)

#### WorldTransform
- Same properties as Transform
- Auto-computed from hierarchy (read-only)

### Systems

#### TransformHierarchySystem
- Group: simulation (last)
- Syncs euler/quaternion and computes world transforms

### Tweening

### Components

#### Tween
- duration: f32 (1) - Seconds
- elapsed: f32
- easingIndex: ui8
- loopMode: ui8 - 0=Once, 1=Loop, 2=PingPong

#### TweenValue
- source: ui32 - Tween entity
- target: ui32 - Target entity
- componentId: ui32
- fieldIndex: ui32
- from: f32
- to: f32
- value: f32 - Current value

### Systems

#### TweenSystem
- Group: simulation
- Interpolates values with easing and auto-cleanup

### Functions

#### createTween(state, entity, target, options): number | null
Animates component property

### Easing Functions

- linear
- sine-in, sine-out, sine-in-out
- quad-in, quad-out, quad-in-out
- cubic-in, cubic-out, cubic-in-out
- quart-in, quart-out, quart-in-out
- expo-in, expo-out, expo-in-out
- circ-in, circ-out, circ-in-out
- back-in, back-out, back-in-out
- elastic-in, elastic-out, elastic-in-out
- bounce-in, bounce-out, bounce-in-out

### Loop Modes

- once - Play once and destroy
- loop - Repeat indefinitely
- ping-pong - Alternate directions

### Shorthand Targets

- rotation - body.eulerX/Y/Z
- at - body.posX/Y/Z
- scale - transform.scaleX/Y/Z

## API Reference (External Links)

- [Core](https://dylanebert.github.io/vibegame/reference/core)
- [Animation](https://dylanebert.github.io/vibegame/reference/animation)
- [Input](https://dylanebert.github.io/vibegame/reference/input)
- [Orbit Camera](https://dylanebert.github.io/vibegame/reference/orbit-camera)
- [Physics](https://dylanebert.github.io/vibegame/reference/physics)
- [Player](https://dylanebert.github.io/vibegame/reference/player)
- [Recipes](https://dylanebert.github.io/vibegame/reference/recipes)
- [Rendering](https://dylanebert.github.io/vibegame/reference/rendering)
- [Respawn](https://dylanebert.github.io/vibegame/reference/respawn)
- [Startup](https://dylanebert.github.io/vibegame/reference/startup)
- [Transforms](https://dylanebert.github.io/vibegame/reference/transforms)
- [Tweening](https://dylanebert.github.io/vibegame/reference/tweening)

## Examples (External Links)

- [Core](https://dylanebert.github.io/vibegame/examples/core)
- [Animation](https://dylanebert.github.io/vibegame/examples/animation)
- [Input](https://dylanebert.github.io/vibegame/examples/input)
- [Orbit Camera](https://dylanebert.github.io/vibegame/examples/orbit-camera)
- [Physics](https://dylanebert.github.io/vibegame/examples/physics)
- [Player](https://dylanebert.github.io/vibegame/examples/player)
- [Recipes](https://dylanebert.github.io/vibegame/examples/recipes)
- [Rendering](https://dylanebert.github.io/vibegame/examples/rendering)
- [Respawn](https://dylanebert.github.io/vibegame/examples/respawn)
- [Startup](https://dylanebert.github.io/vibegame/examples/startup)
- [Transforms](https://dylanebert.github.io/vibegame/examples/transforms)
- [Tweening](https://dylanebert.github.io/vibegame/examples/tweening)
