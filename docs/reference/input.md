# Input Reference

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