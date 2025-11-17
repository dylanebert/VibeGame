# Input Plugin

<!-- LLM:OVERVIEW -->
Focus-aware input handling for mouse, keyboard, and gamepad with buffered actions. Keyboard input only responds when canvas has focus.
<!-- /LLM:OVERVIEW -->

## Purpose

- Capture and normalize input events
- Provide unified input state with focus management
- Handle mouse movement and wheel
- Support gamepad input

## Layout

```
input/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # InputState component
├── systems.ts  # InputSystem
├── utils.ts  # Input event handlers
└── config.ts  # Input configuration
```

## Scope

- **In-scope**: Browser input events, gamepad API
- **Out-of-scope**: Touch input, gestures

## Entry Points

- **plugin.ts**: InputPlugin definition
- **systems.ts**: InputSystem for state updates
- **utils.ts**: Event handler utilities

## Dependencies

- **Internal**: Core ECS
- **External**: Browser DOM/Gamepad APIs

## Components

- **InputState**: Current input state (keys, mouse, gamepad)

## Systems

- **InputSystem**: Updates input state each frame

## Utilities

- **setTargetCanvas**: Register canvas for focus-based input
- **consumeJump**: Consume jump input
- **consumePrimary/Secondary**: Consume action inputs
- **handleMouseMove/Down/Up/Wheel**: Mouse handlers

<!-- LLM:REFERENCE -->
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
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Plugin Registration

```typescript
import * as GAME from 'vibegame';
import { InputPlugin } from 'vibegame/input';

GAME
  .withPlugin(InputPlugin)
  .run();
```

### Reading Input in a Custom System

```typescript
import * as GAME from 'vibegame';
import { Player, InputState } from 'vibegame/input';

const playerQuery = GAME.defineQuery([Player, InputState]);
const PlayerControlSystem: GAME.System = {
  update: (state) => {
    const players = playerQuery(state.world);

    for (const player of players) {
      // Read movement axes
      const moveX = InputState.moveX[player];
      const moveY = InputState.moveY[player];

      // Check for jump
      if (InputState.jump[player]) {
        // Jump is available this frame
      }

      // Check mouse buttons
      if (InputState.leftMouse[player]) {
        // Left mouse is held
      }
    }
  }
};
```

### Consuming Buffered Actions

```typescript
import * as GAME from 'vibegame';

const CombatSystem: GAME.System = {
  update: (state) => {
    // Consume jump if available (prevents double consumption)
    if (GAME.consumeJump()) {
      // Perform jump
      velocity.y = JUMP_FORCE;
    }
    
    // Consume primary action
    if (GAME.consumePrimary()) {
      // Fire weapon
      spawnProjectile();
    }
  }
};
```

### Custom Input Mappings

```typescript
import * as GAME from 'vibegame';

// Modify before starting the game
GAME.INPUT_CONFIG.mappings.jump = ['Space', 'KeyX'];
GAME.INPUT_CONFIG.mappings.moveForward = ['KeyW', 'KeyZ', 'ArrowUp'];
GAME.INPUT_CONFIG.mouseSensitivity.look = 0.3;

GAME.run();
```

### Manual Event Handling

```typescript
import * as GAME from 'vibegame';

// Use the exported handlers directly if needed
canvas.addEventListener('mousedown', GAME.handleMouseDown);
canvas.addEventListener('mouseup', GAME.handleMouseUp);
```
<!-- /LLM:EXAMPLES -->
