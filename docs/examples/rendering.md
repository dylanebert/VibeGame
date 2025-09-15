# Rendering Examples

## Examples

### Basic Rendering Setup

```xml
<!-- Declarative scene with lighting and rendered objects -->
<world canvas="#game-canvas" sky="#87ceeb">
  <!-- Default lighting -->
  <light></light>
  
  <!-- Rendered box -->
  <entity 
    transform
    renderer="shape: box; color: 0xff0000; size-x: 2"
    pos="0 1 0"
  />
  
  <!-- Rendered sphere -->
  <entity
    transform
    renderer="shape: sphere; color: 0x00ff00"
    pos="3 1 0"
  />
</world>
```

### Custom Lighting

```xml
<!-- Separate ambient and directional lights -->
<ambient-light 
  sky-color="#ffd4a3"
  ground-color="#808080"
  intensity="0.4"
/>

<directional-light
  color="#ffffff"
  intensity="1.5"
  direction-x="-1"
  direction-y="3"
  direction-z="-0.5"
  cast-shadow="1"
  shadow-map-size="2048"
/>
```

### Imperative Usage

```typescript
import * as GAME from 'vibegame';

// Create rendered entity programmatically
const entity = state.createEntity();

// Add transform for positioning
state.addComponent(entity, GAME.Transform, {
  posX: 0, posY: 5, posZ: 0
});

// Add renderer component
state.addComponent(entity, GAME.Renderer, {
  shape: 1,        // sphere
  sizeX: 2,
  sizeY: 2,
  sizeZ: 2,
  color: 0xff00ff,
  visible: 1
});

// Set canvas for rendering context
const contextQuery = GAME.defineQuery([GAME.RenderContext]);
const contextEntity = contextQuery(state.world)[0];
const canvas = document.getElementById('game-canvas');
GAME.setCanvasElement(contextEntity, canvas);
```

### Shape Types

```typescript
import * as GAME from 'vibegame';

// Available shape enums
const shapes = {
  box: 0,
  sphere: 1,
  cylinder: 2,
  plane: 3
};

// Use in XML
<entity renderer="shape: sphere"></entity>

// Or with enum names
<entity renderer="shape: 1"></entity>
```

### Visibility Control

```typescript
import * as GAME from 'vibegame';

// Hide/show entities
GAME.Renderer.visible[entity] = 0; // Hide
GAME.Renderer.visible[entity] = 1; // Show

// In XML
<entity renderer="visible: 0"></entity>  <!-- Initially hidden -->
```

### Post-Processing Effects

```xml
<!-- Camera with bloom effect (using defaults) -->
<camera bloom></camera>

<!-- Camera with custom bloom settings -->
<camera bloom="intensity: 2; luminance-threshold: 0.8; luminance-smoothing: 0.05"></camera>

<!-- Camera with mipmap blur settings -->
<camera bloom="mipmap-blur: 1; radius: 0.9; levels: 10"></camera>

<!-- Camera without effects (still uses composer internally) -->
<camera></camera>

<!-- Camera with retro dithering effect -->
<camera dithering="color-bits: 3; intensity: 0.8; scale: 2"></camera>

<!-- Combined bloom and dithering for retro aesthetic -->
<camera bloom="intensity: 1.5" dithering="color-bits: 2; grayscale: 1; scale: 3"></camera>

<!-- Subtle dithering for vintage look -->
<camera dithering="color-bits: 5; intensity: 0.5; scale: 1"></camera>

<!-- Coarse pixel-art style dithering -->
<camera dithering="color-bits: 2; scale: 4; intensity: 1"></camera>
```