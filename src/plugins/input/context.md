# Input Plugin

<!-- LLM:OVERVIEW -->
Tick-based deterministic input handling with bitmask buttons for multiplayer-ready input recording and replay.
<!-- /LLM:OVERVIEW -->

## Purpose

- Capture and normalize input events
- Provide tick-indexed input commands
- Support input recording and replay
- Enable deterministic physics simulation

## Layout

```
input/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # InputState component
├── systems.ts  # InputSystem
├── utils.ts  # Event handlers, circular buffer, helpers
└── config.ts  # Input configuration
```

## Scope

- **In-scope**: Keyboard, mouse, scroll input; deterministic recording
- **Out-of-scope**: Touch input, gamepad (not yet implemented)

## Entry Points

- **plugin.ts**: InputPlugin definition
- **systems.ts**: InputSystem for tick-based sampling
- **utils.ts**: Event handling, buffering, button helpers

## Dependencies

- **Internal**: Core ECS (tick counter)
- **External**: Browser DOM APIs

## Components

- **InputState**: Tick-indexed input with button bitmasks

## Systems

- **InputSystem**: Samples input each frame, stores in circular buffer

## Utilities

- **setTargetCanvas**: Register canvas for focus-based input
- **InputBuffer**: 256-frame circular buffer for replay
- **Test helpers**: setJump, getJump, etc.

<!-- LLM:REFERENCE -->
### Components

#### InputState
- tick: ui32 - Frame number
- buttons: ui16 - Bitmask (JUMP=0x01, PRIMARY=0x02, LEFT_MOUSE=0x200, etc.)
- moveX: f32 - Horizontal axis (-1 left, 1 right)
- moveY: f32 - Forward/backward (-1 back, 1 forward)
- lookDeltaX: f32 - Mouse delta X
- lookDeltaY: f32 - Mouse delta Y
- scrollDelta: f32 - Mouse wheel delta

#### InputButtons
Constants for button bitmasks:
- JUMP: 0x0001
- PRIMARY: 0x0002
- SECONDARY: 0x0004
- LEFT_MOUSE: 0x0200
- RIGHT_MOUSE: 0x0400

### Systems

#### InputSystem
- Group: simulation
- Samples raw input → creates InputCommand → updates InputState components
- Stores commands in global circular buffer

### Functions

#### setTargetCanvas(canvas: HTMLCanvasElement | null): void
Registers canvas for focus-based keyboard input

#### getGlobalInputBuffer(): InputBuffer
Returns the global input recording buffer

#### setButton(eid: number, button: number, value: boolean): void
Helper to set a button bit in InputState

#### getButton(eid: number, button: number): boolean
Helper to read a button bit from InputState

### Constants

#### INPUT_CONFIG
Default input mappings and sensitivity settings
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Reading Input with Bitmasks

```typescript
import * as GAME from 'vibegame';

const playerQuery = GAME.defineQuery([GAME.Player, GAME.InputState]);
const PlayerControlSystem: GAME.System = {
  update: (state) => {
    const players = playerQuery(state.world);

    for (const player of players) {
      const moveX = GAME.InputState.moveX[player];
      const moveY = GAME.InputState.moveY[player];

      const isJumping = (GAME.InputState.buttons[player] & GAME.InputButtons.JUMP) !== 0;
      const isLeftMouseDown = (GAME.InputState.buttons[player] & GAME.InputButtons.LEFT_MOUSE) !== 0;

      if (isJumping) {
        velocity.y = JUMP_FORCE;
      }
    }
  }
};
```

### Recording and Replaying Input

```typescript
import * as GAME from 'vibegame';

const buffer = GAME.getGlobalInputBuffer();

// After gameplay, extract recording
const recording = buffer.getRange(0, state.time.tick);

// Later, replay by setting InputState directly
for (const command of recording) {
  GAME.InputState.tick[player] = command.tick;
  GAME.InputState.buttons[player] = command.buttons;
  GAME.InputState.moveX[player] = command.moveX;
  GAME.InputState.moveY[player] = command.moveY;
  state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
}
```

### Button Helpers

```typescript
import { setButton, getButton, InputButtons } from 'vibegame';

// Use helpers instead of direct bitmask manipulation
setButton(player, InputButtons.JUMP, true);
expect(getButton(player, InputButtons.JUMP)).toBe(true);
```
<!-- /LLM:EXAMPLES -->
