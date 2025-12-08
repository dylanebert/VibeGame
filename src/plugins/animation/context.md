# Animation Plugin

<!-- LLM:OVERVIEW -->
Procedural character animation with body parts responding to movement states.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Components

**AnimatedCharacter**
- headEntity, torsoEntity, leftArm/rightArm/leftLeg/rightLegEntity: eid
- phase: f32 (0-1) - Walk cycle
- animationState: ui8 - 0=IDLE, 1=WALKING, 2=JUMPING, 3=FALLING, 4=LANDING
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```xml
<entity animated-character character-controller transform="pos: 0 2 0"></entity>
```

```typescript
// Check animation state
if (AnimatedCharacter.animationState[entity] === 2) { /* jumping */ }
```
<!-- /LLM:EXAMPLES -->
