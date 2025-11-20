# Tweening Plugin

<!-- LLM:OVERVIEW -->
Animates component properties with easing functions. Tweens are one-shot animations that destroy on completion. Sequences are reusable animation definitions that can be played, stopped, and reset. Kinematic velocity bodies use velocity-based tweening for smooth physics-correct movement.
<!-- /LLM:OVERVIEW -->

## Layout

```
tweening/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # Tween, TweenValue, KinematicTween, KinematicRotationTween, Sequence
├── systems.ts  # KinematicTweenSystem, KinematicRotationTweenSystem, TweenSystem, SequenceSystem
├── parser.ts  # Tween and sequence XML parsers
└── utils.ts  # Easing functions, tween creation, sequence registry
```

## Scope

- **In-scope**: Property animations, easing functions, velocity-based kinematic tweening, sequences with pauses
- **Out-of-scope**: Skeletal animation, physics interpolation, looping, ping-pong

## Entry Points

- **plugin.ts**: TweenPlugin definition for registration
- **systems.ts**: KinematicTweenSystem, KinematicRotationTweenSystem (fixed group), TweenSystem, SequenceSystem (simulation group)
- **parser.ts**: Parses `<tween>` and `<sequence>` elements from XML scenes

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

### Shorthand Targets

Shorthands expand to multiple TweenValue entities (one per axis):

| Shorthand | Expands To | Notes |
|-----------|------------|-------|
| `at` | transform.posX/Y/Z | Position animation |
| `scale` | transform.scaleX/Y/Z | Scale animation |
| `rotation` | body.eulerX/Y/Z or transform.eulerX/Y/Z | Uses body if present |

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

// Sequence control
playSequence(state, entity): void   // Start from current position
stopSequence(state, entity): void   // Stop and clear active tweens
resetSequence(state, entity): void  // Stop and reset to beginning
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

<!-- Position (3 tweens created) -->
<tween target="cube" attr="at" from="0 0 0" to="10 5 0" duration="2"></tween>

<!-- Scale (3 tweens created) -->
<tween target="cube" attr="scale" from="1 1 1" to="2 2 2" duration="1"></tween>

<!-- Rotation - uses body if present, else transform -->
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
  <!-- Group 1: These run in parallel -->
  <tween target="cube" attr="at" from="-10 0 0" to="0 0 0" duration="1" easing="sine-out"></tween>
  <tween target="cube" attr="scale" from="0 0 0" to="1 1 1" duration="0.5" easing="back-out"></tween>

  <pause duration="0.3"></pause>

  <!-- Group 2: Runs after pause -->
  <tween target="cube" attr="scale" to="1.2 1.2 1.2" duration="0.2" easing="quad-out"></tween>

  <pause duration="0.1"></pause>

  <!-- Group 3: Runs after second pause -->
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
<!-- /LLM:EXAMPLES -->
