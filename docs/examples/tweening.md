# Tweening Examples

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