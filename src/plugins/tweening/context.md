# Tweening Plugin

<!-- LLM:OVERVIEW -->
Animates component properties with easing functions and loop modes.
<!-- /LLM:OVERVIEW -->

## Layout

```
tweening/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # Tween components
├── systems.ts  # TweenSystem
├── parser.ts  # Tween XML parser
└── utils.ts  # Easing functions
```

## Scope

- **In-scope**: Property animations, easing functions, loop modes, XML tween definitions
- **Out-of-scope**: Skeletal animation, physics interpolation

## Entry Points

- **plugin.ts**: TweenPlugin definition for registration
- **systems.ts**: TweenSystem processes active tweens each frame
- **parser.ts**: Parses `<tween>` elements from XML scenes

## Dependencies

- **Internal**: Core ECS, math utilities (lerp)
- **External**: gsap (for easing functions)

<!-- LLM:REFERENCE -->
### Components

#### Tween
- duration: f32 (1) - Seconds
- elapsed: f32
- easingIndex: ui8
- loopMode: ui8 - 0=Once, 1=Loop, 2=PingPong

#### TweenValue
- source: ui32 - Tween entity
- target: ui32 - Target entity
- componentId: ui32
- fieldIndex: ui32
- from: f32
- to: f32
- value: f32 - Current value

### Systems

#### TweenSystem
- Group: simulation
- Interpolates values with easing and auto-cleanup

### Functions

#### createTween(state, entity, target, options): number | null
Animates component property

### Easing Functions

- linear
- sine-in, sine-out, sine-in-out
- quad-in, quad-out, quad-in-out
- cubic-in, cubic-out, cubic-in-out
- quart-in, quart-out, quart-in-out
- expo-in, expo-out, expo-in-out
- circ-in, circ-out, circ-in-out
- back-in, back-out, back-in-out
- elastic-in, elastic-out, elastic-in-out
- bounce-in, bounce-out, bounce-in-out

### Loop Modes

- once - Play once and destroy
- loop - Repeat indefinitely
- ping-pong - Alternate directions

### Shorthand Targets

- rotation - body.eulerX/Y/Z
- at - body.posX/Y/Z
- scale - transform.scaleX/Y/Z
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic XML Tween

```xml
<!-- Animate Y position from 5 to 10 over 2 seconds -->
<kinematic-part pos="0 5 -5">
  <tween 
    target="body.pos-y" 
    from="5" 
    to="10" 
    duration="2" 
    ease="sine-in-out" 
    loop="ping-pong"
  />
</kinematic-part>
```

### Multiple Properties

```xml
<!-- Animate rotation on all axes -->
<entity transform renderer>
  <tween 
    target="rotation" 
    to="0 360 0" 
    duration="4" 
    loop="loop"
  />
</entity>
```

### Body Physics Properties

```xml
<!-- Animate physics body velocity -->
<dynamic-part pos="0 10 0">
  <tween 
    target="body.velocity-x" 
    from="0" 
    to="10" 
    duration="1" 
    ease="quad-out"
  />
</tween>
```

### Programmatic Usage

```typescript
import * as GAME from 'vibegame';

// In a system
const MySystem = {
  setup: (state) => {
    const entity = state.createEntity();
    state.addComponent(entity, GAME.Transform);
    
    // Create tween programmatically
    GAME.createTween(state, entity, 'body.pos-y', {
      from: 0,
      to: 10,
      duration: 2,
      easing: 'bounce-out',
      loop: 'once'
    });
  }
};
```

### Complex Animation Sequence

```xml
<!-- Platform with multiple animated properties -->
<kinematic-part pos="0 0 0" color="#ff0000">
  <!-- Position animation -->
  <tween target="body.pos-x" from="-5" to="5" duration="3" loop="ping-pong"></tween>
  <!-- Rotation animation -->
  <tween target="body.euler-y" to="360" duration="10" loop="loop"></tween>
  <!-- Scale pulse -->
  <tween target="transform.scale-x" from="1" to="1.5" duration="1" ease="sine-in-out" loop="ping-pong"></tween>
  <tween target="transform.scale-z" from="1" to="1.5" duration="1" ease="sine-in-out" loop="ping-pong"></tween>
</kinematic-part>
```
<!-- /LLM:EXAMPLES -->