# Tweening Reference

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