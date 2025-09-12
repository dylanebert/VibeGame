# Player Examples

## Examples

### Basic Player Usage (XML)

```xml
<world>
  <!-- Player auto-created if not specified -->
  <player pos="0 2 0" speed="6" jump-height="3" />
</world>
```

### Custom Player Configuration (XML)

```xml
<world>
  <player 
    pos="5 1 -10"
    speed="8"
    jump-height="4"
    rotation-speed="15"
    camera-sensitivity="0.005"
  />
</world>
```

### Accessing Player Component (JavaScript)

```typescript
import * as GAME from 'vibegame';

const MySystem: GAME.System = {
  update: (state) => {
    const playerQuery = GAME.defineQuery([GAME.Player]);
    const players = playerQuery(state.world);
    for (const entity of players) {
      // Check if player is jumping
      if (GAME.Player.isJumping[entity]) {
        console.log('Player is airborne!');
      }
      
      // Modify player speed
      GAME.Player.speed[entity] = 10;
    }
  }
};
```

### Creating Player Programmatically

```typescript
import * as GAME from 'vibegame';

const PlayerSpawnSystem: GAME.System = {
  setup: (state) => {
    // Create player entity
    const player = state.createEntity();
    
    // Add player recipe components
    state.addComponent(player, GAME.Player, {
      speed: 7,
      jumpHeight: 3.5,
      cameraSensitivity: 0.01
    });
    
    // Add required components
    state.addComponent(player, GAME.Transform, { posY: 5 });
    state.addComponent(player, GAME.Body, { type: GAME.BodyType.KinematicPositionBased });
    state.addComponent(player, GAME.CharacterController);
    state.addComponent(player, GAME.InputState);
  }
};
```

### Movement Controls

**Keyboard:**
- W/S or Arrow Up/Down - Move forward/backward
- A/D or Arrow Left/Right - Move left/right 
- Space - Jump

**Mouse:**
- Right-click + drag - Rotate camera
- Scroll wheel - Zoom in/out

### Plugin Registration

```typescript
import * as GAME from 'vibegame';

GAME
  .withPlugin(GAME.PlayerPlugin)  // Included in defaults
  .run();
```