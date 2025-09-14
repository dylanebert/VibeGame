# Animation Examples

## Examples

### Basic Usage

```typescript
import * as GAME from 'vibegame';

// Add animated character to a player entity
const player = state.createEntity();
state.addComponent(player, GAME.AnimatedCharacter);
state.addComponent(player, GAME.CharacterController);
state.addComponent(player, GAME.Transform);

// The AnimatedCharacterInitializationSystem will automatically
// create body parts in the next setup phase
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
      if (animState === 2) { // JUMPING
        console.log('Character is jumping!');
      }
    }
  }
};
```

### XML Declaration

```xml
<!-- Player entity with animated character -->
<entity 
  animated-character
  character-controller
  transform="pos: 0 2 0"
/>
```