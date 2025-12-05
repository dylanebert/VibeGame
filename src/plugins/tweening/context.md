# Tweening Plugin

<!-- LLM:OVERVIEW -->
Animates component properties with easing functions. Tweens are one-shot animations that destroy on completion. Sequences are reusable animation definitions that can be played, stopped, and reset. Shakers provide additive presentation modifiers without changing base values. Kinematic velocity bodies use velocity-based tweening for smooth physics-correct movement.
<!-- /LLM:OVERVIEW -->

## Layout

```
tweening/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # Tween, TweenValue, KinematicTween, KinematicRotationTween, Sequence, Shaker, TransformShaker
├── systems.ts  # Tween, Sequence, Kinematic, and Shaker systems
├── parser.ts  # Tween, sequence, and shaker XML parsers
└── utils.ts  # Easing functions, tween/shaker creation, registries
```

## Scope

- **In-scope**: Property animations, easing functions, velocity-based kinematic tweening, sequences with pauses, presentation-only shakers
- **Out-of-scope**: Skeletal animation, physics interpolation, looping, ping-pong

## Entry Points

- **plugin.ts**: TweenPlugin definition for registration
- **systems.ts**: Kinematic systems (fixed), Tween/Sequence systems (simulation), Shaker systems (draw)
- **parser.ts**: Parses `<tween>`, `<sequence>`, and `<shaker>` elements from XML

## Dependencies

- **Internal**: Core ECS, physics (Body, SetLinearVelocity, SetAngularVelocity)
- **External**: gsap (for easing functions)

<!-- LLM:REFERENCE -->
### Name Resolution

Entities with `name` attribute are registered in a name→entityId map at parse time. Tweens and sequences reference targets by name, resolved to entity IDs during parsing.

```xml
<!-- Name registered at parse time -->
<kinematic-part name="door" pos="0 0 0" shape="box" size="2 4 0.2"></kinematic-part>

<!-- "door" resolved to entity ID when parsing tween -->
<tween target="door" attr="body.pos-y" to="3" duration="2"></tween>
```

Runtime lookup via `state.getEntityByName('door')` returns the entity ID.

### Components

**Tween** - Animation controller (auto-destroyed on completion)
- duration: f32 (1) - Seconds
- elapsed: f32 - Current time
- easingIndex: ui8 - Index into easing functions

**TweenValue** - Property interpolation (one per animated field)
- source: ui32 - Tween entity reference
- target: ui32 - Animated entity
- from/to: f32 - Value range
- value: f32 - Current interpolated value

**KinematicTween** - Velocity-based position animation for physics bodies
- tweenEntity: ui32, targetEntity: ui32
- axis: ui8 (0=X, 1=Y, 2=Z)
- from/to: f32 - Position range

**KinematicRotationTween** - Velocity-based rotation for physics bodies
- Same structure as KinematicTween, values in radians

**Sequence** - Sequential animation orchestrator
- state: ui8 (Idle=0, Playing=1)
- currentIndex: ui32
- itemCount: ui32
- pauseRemaining: f32

**Shaker** - Presentation modifier for non-transform fields (applied at draw time, restored after)
- target: eid - Entity being modified
- value: f32 - Modification value
- intensity: f32 - Effect multiplier (0-1)
- mode: ui8 (Additive=0, Multiplicative=1)

**TransformShaker** - Presentation modifier for WorldTransform (position/scale/rotation)
- target: eid - Entity being modified
- type: ui8 (Position=0, Scale=1, Rotation=2)
- axes: ui8 - Bitmask (X=1, Y=2, Z=4, XYZ=7)
- value: f32 - Modification value
- intensity: f32 - Effect multiplier (0-1)
- mode: ui8 (Additive=0, Multiplicative=1)

### Shaker System

Shakers modify component values at draw time without affecting simulation. Regular shakers target arbitrary component fields. Transform shakers target WorldTransform (which rendering uses) via quaternion multiplication for rotation (avoiding gimbal lock).

**Auto-detection**: `createShaker()` automatically creates TransformShaker when targeting transform fields (transform.pos-*, transform.scale-*, transform.euler-*, or shorthands).

**Formulas:**
- Additive: `result = base + (value * intensity)`
- Multiplicative: `result = base * (1 + (value - 1) * intensity)`
- Rotation: quaternion multiplication (degrees input)

**Composition order:** All additive shakers apply first, then multiplicative.

### Shorthand Targets

Shorthands expand to multiple TweenValue entities for tweens, or set axes bitmask for shakers:

| Shorthand | Expands To | Notes |
|-----------|------------|-------|
| `at` | transform.posX/Y/Z | Position animation |
| `scale` | transform.scaleX/Y/Z | Scale animation (all axes uniform for shakers) |
| `rotation` | body.eulerX/Y/Z or transform.eulerX/Y/Z | Uses body if present for tweens |

### Kinematic Body Detection

For `<kinematic-part>` entities, tweens on body.pos-* or body.euler-* fields automatically create KinematicTween/KinematicRotationTween instead of TweenValue. This uses velocity-based movement for physics-correct behavior.

### Sequence Execution Model

1. Tweens before first `<pause>` start simultaneously
2. `<pause>` waits for all active tweens + pause duration
3. Next group of tweens starts after pause completes
4. Sequence resets to Idle when all items processed

### Functions

```typescript
// Create one-shot tween (returns tween entity ID)
createTween(state, entity, target, options): number | null

// Create shaker (returns shaker entity ID)
createShaker(state, entity, target, options): number | null

// Sequence control
playSequence(state, entity): void      // Start from current position
stopSequence(state, entity): void      // Stop and clear active tweens
resetSequence(state, entity): void     // Stop and reset to beginning
completeSequence(state, entity): void  // Jump to end, apply final values
```

### Easing Functions

`linear`, `sine-in/out/in-out`, `quad-in/out/in-out`, `cubic-in/out/in-out`, `quart-in/out/in-out`, `expo-in/out/in-out`, `circ-in/out/in-out`, `back-in/out/in-out`, `elastic-in/out/in-out`, `bounce-in/out/in-out`
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## XML (Declarative) Patterns

### Standalone Tween

```xml
<kinematic-part name="platform" pos="0 2 0" shape="box" size="4 0.5 4"></kinematic-part>
<tween target="platform" attr="body.pos-x" from="-5" to="5" duration="3" easing="sine-in-out"></tween>
```

### Shorthand Tweens

```xml
<entity name="cube" transform renderer="shape: box"></entity>
<tween target="cube" attr="at" from="0 0 0" to="10 5 0" duration="2"></tween>
<tween target="cube" attr="scale" from="1 1 1" to="2 2 2" duration="1"></tween>
<tween target="cube" attr="rotation" from="0 0 0" to="0 180 0" duration="2"></tween>
```

### Named Sequence (Reusable)

Sequences with `name` start paused. Trigger via `playSequence()` in TypeScript.

```xml
<entity name="button" transform renderer="shape: box; color: 0x4488ff"></entity>

<sequence name="button-press">
  <tween target="button" attr="scale" from="1 1 1" to="0.9 0.9 0.9" duration="0.1" easing="quad-out"></tween>
  <pause duration="0.05"></pause>
  <tween target="button" attr="scale" from="0.9 0.9 0.9" to="1 1 1" duration="0.15" easing="back-out"></tween>
</sequence>
```

### Autoplay Sequence (Parallel + Sequential)

Tweens before `<pause>` run simultaneously. Pause separates sequential groups.

```xml
<entity name="cube" transform renderer="shape: box"></entity>

<sequence autoplay="true">
  <tween target="cube" attr="at" from="-10 0 0" to="0 0 0" duration="1" easing="sine-out"></tween>
  <tween target="cube" attr="scale" from="0 0 0" to="1 1 1" duration="0.5" easing="back-out"></tween>
  <pause duration="0.3"></pause>
  <tween target="cube" attr="scale" to="1.2 1.2 1.2" duration="0.2" easing="quad-out"></tween>
  <pause duration="0.1"></pause>
  <tween target="cube" attr="scale" to="1 1 1" duration="0.15" easing="sine-in-out"></tween>
</sequence>
```

## TypeScript (Imperative) Patterns

### Basic Tween

```typescript
import { createTween } from 'vibegame/tweening';

// Single field
createTween(state, entity, 'transform.pos-x', {
  from: 0,
  to: 10,
  duration: 2,
  easing: 'sine-out'
});
```

### Shorthand Tweens

```typescript
// Position (creates 3 TweenValue entities)
createTween(state, entity, 'at', {
  from: [0, 0, 0],
  to: [10, 5, 0],
  duration: 1.5,
  easing: 'quad-out'
});

// Scale
createTween(state, entity, 'scale', {
  from: [1, 1, 1],
  to: [2, 2, 2],
  duration: 0.5,
  easing: 'back-out'
});

// Rotation (degrees, auto-detects body vs transform)
createTween(state, entity, 'rotation', {
  from: [0, 0, 0],
  to: [0, 180, 0],
  duration: 2
});
```

### Triggering Named Sequences

```typescript
import { playSequence, resetSequence, stopSequence } from 'vibegame/tweening';

// Get sequence entity by name
const buttonPress = state.getEntityByName('button-press');

// Trigger sequence (reset first for replay)
resetSequence(state, buttonPress);
playSequence(state, buttonPress);

// Or stop mid-animation
stopSequence(state, buttonPress);
```

### Event-Driven Sequence Pattern

```typescript
// Define trigger component
const TriggerSequence = GAME.defineComponent({});
const triggerQuery = GAME.defineQuery([TriggerSequence, Sequence]);

// System processes triggers
const TriggerSequenceSystem: GAME.System = {
  group: 'simulation',
  update(state) {
    for (const eid of triggerQuery(state.world)) {
      resetSequence(state, eid);
      playSequence(state, eid);
      state.removeComponent(eid, TriggerSequence);
    }
  }
};

// Trigger from DOM event
document.getElementById('btn')?.addEventListener('click', () => {
  const seq = state.getEntityByName('my-sequence');
  if (seq !== null) state.addComponent(seq, TriggerSequence);
});
```

### Driver Pattern: One Value Drives Many Entities

A driver is a single tweened value that controls multiple entities via a system. This is useful for coordinated animations like breathing, pulsing, or wave effects.

```xml
<!-- Driver component holds the tweened value -->
<entity name="breathe-driver" breathe-driver="value: 0"></entity>

<!-- All entities with "breathe" marker are affected -->
<entity name="cube1" transform renderer="shape: box" breathe></entity>
<entity name="cube2" transform="pos: 3 0 0" renderer="shape: box" breathe></entity>
<entity name="cube3" transform="pos: -3 0 0" renderer="shape: box" breathe></entity>

<!-- Tween the driver to control all breathing entities -->
<tween target="breathe-driver" attr="breathe-driver.value" from="0" to="1" duration="0.5"></tween>
```

```typescript
// System reads driver value, applies to all marked entities
const BreatheSystem: System = {
  group: 'simulation',
  update(state) {
    const drivers = driverQuery(state.world);
    if (drivers.length === 0) return;
    const driverValue = BreatheDriver.value[drivers[0]];

    const oscillation = Math.sin(state.time.elapsed * 2) * 0.2 * driverValue;
    for (const eid of breatheQuery(state.world)) {
      Transform.scaleX[eid] = 1 + oscillation;
      Transform.scaleY[eid] = 1 + oscillation;
      Transform.scaleZ[eid] = 1 + oscillation;
    }
  }
};
```

### Shakers: Layered Modifications via Tweening

Shakers enable multiple independent effects on the same property. Each shaker has an `intensity` that can be tweened, allowing effects to be faded in/out independently.

```xml
<!-- Entity with two shakers targeting scale -->
<entity name="cube" transform renderer="shape: box"></entity>

<!-- Shaker 1: Pulse effect (multiplicative) -->
<shaker name="pulse" target="cube" attr="scale" value="0.8" intensity="0" mode="multiplicative"></shaker>

<!-- Shaker 2: Bounce effect (additive, single axis) -->
<shaker name="bounce" target="cube" attr="transform.scale-y" value="0.3" intensity="0" mode="additive"></shaker>

<!-- Tween shaker intensities independently - use "shaker.intensity" (alias resolves automatically) -->
<sequence name="activate-effects">
  <tween target="pulse" attr="shaker.intensity" to="1" duration="0.3" easing="expo-out"></tween>
  <pause duration="0.1"></pause>
  <tween target="bounce" attr="shaker.intensity" to="1" duration="0.2" easing="back-out"></tween>
</sequence>

<sequence name="deactivate-effects">
  <tween target="bounce" attr="shaker.intensity" to="0" duration="0.2"></tween>
  <tween target="pulse" attr="shaker.intensity" to="0" duration="0.3"></tween>
</sequence>
```

Key benefits:
- **Safe composition**: Shakers apply at draw time without modifying base values
- **Independent control**: Each shaker's intensity is separately tweened
- **Order guarantees**: Additive shakers apply first, then multiplicative
- **Alias resolution**: `shaker.intensity` resolves to `transform-shaker.intensity` when targeting transform properties

### Transform Shaker (TypeScript)

```typescript
import { createShaker, createTween } from 'vibegame/tweening';

// Auto-detects transform target, creates TransformShaker
const shakerId = createShaker(state, entity, 'transform.pos-y', {
  value: 0.5,
  intensity: 1,
  mode: 'additive'
});

// Tween intensity to fade effect (use 'shaker.intensity' - resolves automatically)
createTween(state, shakerId, 'shaker.intensity', { from: 1, to: 0, duration: 0.5 });
```
<!-- /LLM:EXAMPLES -->
