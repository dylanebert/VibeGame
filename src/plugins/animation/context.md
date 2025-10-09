# Animation Plugin

<!-- LLM:OVERVIEW -->
Procedural character animation with body parts that respond to movement states.
<!-- /LLM:OVERVIEW -->

## Purpose

- Create animated character models with body parts
- Procedurally animate based on movement states
- Handle walk cycles, jumping, falling, and landing animations
- Synchronize animations with physics state
- Automatically clean up body parts when characters are destroyed

## Layout

```
animation/
├── context.md  # This file, folder context (Tier 2)
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # AnimatedCharacter, HasAnimator
├── systems.ts  # Initialization and update systems
├── utils.ts  # Animation helper functions
└── constants.ts  # Body part definitions and config
```

## Scope

- **In-scope**: Procedural character animation, body part management, movement-based animation states
- **Out-of-scope**: Three.js animation clips, tween animations, non-character animations

## Entrypoints

- **plugin.ts**: AnimationPlugin definition with systems and components
- **systems.ts**: AnimatedCharacterInitializationSystem (setup batch), AnimatedCharacterCleanupSystem (simulation batch), AnimatedCharacterUpdateSystem (simulation batch)
- **index.ts**: Public exports (AnimatedCharacter, HasAnimator, AnimationPlugin)

## Dependencies

- **Internal**: Core ECS, transforms (Transform), rendering (Renderer), physics (Body, CharacterController, InterpolatedTransform, CharacterMovement), input (InputState), recipes (Parent)
- **External**: None (purely procedural)

<!-- LLM:REFERENCE -->
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

#### AnimatedCharacterCleanupSystem
- Group: simulation
- Checks if parent player entity exists; destroys character and body parts if parent is gone

#### AnimatedCharacterUpdateSystem
- Group: simulation
- Updates character animation based on movement and physics state
- Uses Body.grounded for ground detection (works with both local and networked entities)
- Movement detection: InputState + CharacterMovement for local players, velocity calculation from InterpolatedTransform for networked players
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Usage

```typescript
import * as GAME from 'vibegame';

const player = state.createEntity();
state.addComponent(player, GAME.AnimatedCharacter);
state.addComponent(player, GAME.CharacterController);
state.addComponent(player, GAME.Transform);
```

### Accessing Animation State

```typescript
import * as GAME from 'vibegame';

const characterQuery = GAME.defineQuery([GAME.AnimatedCharacter]);
const MySystem: GAME.System = {
  update: (state) => {
    const characters = characterQuery(state.world);
    for (const entity of characters) {
      const animState = GAME.AnimatedCharacter.animationState[entity];
      if (animState === 2) {
        console.log('Character is jumping!');
      }
    }
  }
};
```

### XML Declaration

```xml
<entity
  animated-character
  character-controller
  transform="pos: 0 2 0"
/>
```
<!-- /LLM:EXAMPLES -->
