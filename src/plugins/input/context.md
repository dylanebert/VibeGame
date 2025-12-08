# Input Plugin

<!-- LLM:OVERVIEW -->
Focus-aware input for mouse, keyboard, gamepad with buffered actions. Keyboard responds only when canvas focused.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Components

**InputState**
- moveX/Y/Z: f32 - Movement axes (-1 to 1)
- lookX/Y: f32 - Mouse delta
- scrollDelta: f32 - Wheel delta
- jump, primaryAction, secondaryAction: ui8 (0/1)
- leftMouse, rightMouse, middleMouse: ui8 (0/1)

### Functions
- `setTargetCanvas(canvas)` - Register canvas for focus input
- `consumeJump()` - Consume buffered jump
- `consumePrimary/Secondary()` - Consume buffered actions
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```typescript
import { InputState, consumeJump, consumePrimary } from 'vibegame/input';

// Read input in system
const moveX = InputState.moveX[entity];
if (InputState.jump[entity]) { /* jump available */ }

// Consume buffered action (prevents double use)
if (consumeJump()) { velocity.y = JUMP_FORCE; }
if (consumePrimary()) { spawnProjectile(); }
```
<!-- /LLM:EXAMPLES -->
