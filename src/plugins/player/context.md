# Player Plugin

<!-- LLM:OVERVIEW -->
Player character controller with physics movement, jumping, and platform momentum inheritance.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Components

**Player**
- speed: f32 (5.3), jumpHeight: f32 (2.3), rotationSpeed: f32 (10)
- canJump, isJumping: ui8
- cameraEntity: eid - Linked camera for orientation
- inheritedVelX/Z: f32 - Platform momentum

### Recipe
- `<player>` - Complete setup with physics, input, respawn
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```xml
<!-- Auto-created if omitted, or customize -->
<player pos="0 2 0" speed="8" jump-height="3"></player>
```

**Controls**: WASD/Arrows move, Space jump. Camera via OrbitCameraPlugin.
<!-- /LLM:EXAMPLES -->
