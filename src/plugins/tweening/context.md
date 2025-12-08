# Tweening Plugin

<!-- LLM:OVERVIEW -->
Animates properties with easing. Tweens auto-destroy on completion. Sequences group tweens with timing. Shakers add presentation effects without changing base values.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Components

**Tween** - Animation controller (auto-destroyed)
- duration: f32 (1), elapsed: f32, easingIndex: ui8

**TweenValue** - Per-field interpolation
- target: eid, from/to/value: f32

**Sequence** - Animation orchestrator
- state: ui8 (Idle=0, Playing=1), currentIndex, itemCount, pauseRemaining: f32

**Shaker** - Presentation modifier (draw-time only)
- target: eid, value: f32, intensity: f32 (0-1)
- mode: ui8 (Additive=0, Multiplicative=1)

### Shorthand Targets

| Shorthand | Expands To |
|-----------|------------|
| `at` | transform.posX/Y/Z |
| `scale` | transform.scaleX/Y/Z |
| `rotation` | body.eulerX/Y/Z (or transform) |

### Easing Functions
`linear`, `sine-in/out/in-out`, `quad-*`, `cubic-*`, `quart-*`, `expo-*`, `circ-*`, `back-*`, `elastic-*`, `bounce-*`

### Functions

```typescript
createTween(state, entity, target, options): number | null
createShaker(state, entity, target, options): number | null
playSequence(state, entity): void
stopSequence(state, entity): void
resetSequence(state, entity): void
completeSequence(state, entity): void
```
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
### XML Tweens

```xml
<!-- Single property -->
<kinematic-part name="lift" pos="0 0 0" shape="box" size="4 0.5 4"></kinematic-part>
<tween target="lift" attr="body.pos-y" from="0" to="5" duration="3" easing="sine-in-out"></tween>

<!-- Shorthands -->
<renderer name="cube" shape="box"></renderer>
<tween target="cube" attr="at" to="10 5 0" duration="2"></tween>
<tween target="cube" attr="scale" to="2 2 2" duration="1" easing="back-out"></tween>
```

### Sequences

```xml
<!-- Named sequence (starts paused) -->
<sequence name="bounce">
  <tween target="cube" attr="scale" to="1.3 1.3 1.3" duration="0.15" easing="back-out"></tween>
  <pause duration="0.1"></pause>
  <tween target="cube" attr="scale" to="1 1 1" duration="0.15"></tween>
</sequence>

<!-- Autoplay: tweens before pause run in parallel -->
<sequence autoplay="true">
  <tween target="cube" attr="at" to="0 0 0" duration="1"></tween>
  <tween target="cube" attr="scale" to="1 1 1" duration="0.5"></tween>
  <pause duration="0.3"></pause>
  <tween target="cube" attr="scale" to="1.2 1.2 1.2" duration="0.2"></tween>
</sequence>
```

### TypeScript

```typescript
import { createTween, playSequence, resetSequence } from 'vibegame/tweening';

// Create tween
createTween(state, entity, 'at', { from: [0,0,0], to: [10,5,0], duration: 1.5 });

// Trigger sequence
const seq = state.getEntityByName('bounce');
resetSequence(state, seq);
playSequence(state, seq);
```

### Shakers

```xml
<!-- Multiple effects on same property -->
<shaker name="pulse" target="cube" attr="scale" value="0.8" intensity="0" mode="multiplicative"></shaker>
<tween target="pulse" attr="shaker.intensity" to="1" duration="0.3"></tween>
```

Shakers modify at draw time, base values unchanged. Use `shaker.intensity` to tween effect strength.
<!-- /LLM:EXAMPLES -->
