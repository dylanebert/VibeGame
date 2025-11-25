# Rendering Plugin

<!-- LLM:OVERVIEW -->
Lightweight Three.js rendering wrapper with meshes, lights, and cameras.
<!-- /LLM:OVERVIEW -->

## Layout

```
rendering/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # Rendering components
├── systems.ts  # Rendering systems
├── operations.ts  # Mesh and shadow operations
└── utils.ts  # Canvas, context utilities, and constants
```

## Scope

- **In-scope**: Three.js rendering, mesh management, lighting, camera sync, canvas sizing
- **Out-of-scope**: Post-processing effects (handled by postprocessing plugin), Physics visualization, UI overlays

## Canvas Sizing

Renderer and camera use `canvas.clientWidth/clientHeight` for sizing and aspect ratio, respecting CSS dimensions. Multiple canvases per page require separate State instances (one State per canvas).

## Performance

- **Dynamic instance pooling**: Starts at 1000 instances per shape, automatically doubles when full
- **Performance warning**: Console warning at 10,000 total instances
- **Hard limit**: 50,000 total instances (throws error)
- **Roblox-like scaling**: Graceful growth with developer-friendly warnings

## Entry Points

- **plugin.ts**: RenderingPlugin bundles all components, systems, and recipes
- **systems.ts**: Rendering systems executed each frame
- **index.ts**: Public API exports

## Dependencies

- **Internal**: Transforms plugin (WorldTransform component)
- **External**: Three.js

<!-- LLM:REFERENCE -->
### Components

#### Renderer
- shape: ui8 - 0=box, 1=sphere
- sizeX, sizeY, sizeZ: f32 (1)
- color: ui32 (0xffffff)
- visible: ui8 (1)
- unlit: ui8 (0) - Use unlit material (ignores lighting)

#### RenderContext
- clearColor: ui32 (0x000000)
- hasCanvas: ui8

#### MainCamera
- projection: ui8 (0) - 0=perspective, 1=orthographic
- fov: f32 (75) - Field of view in degrees (perspective only)
- orthoSize: f32 (10) - Vertical size in world units (orthographic only)

#### AmbientLight
- skyColor: ui32 (0x87ceeb)
- groundColor: ui32 (0x4a4a4a)
- intensity: f32 (0.6)

#### DirectionalLight
- color: ui32 (0xffffff)
- intensity: f32 (1)
- castShadow: ui8 (1)
- shadowMapSize: ui32 (4096)
- directionX: f32 (-1)
- directionY: f32 (2)
- directionZ: f32 (-1)
- distance: f32 (30)

### Systems

#### MeshInstanceSystem
- Group: draw
- Synchronizes transforms with Three.js meshes

#### LightSyncSystem
- Group: draw
- Updates Three.js lights

#### CameraSyncSystem
- Group: draw
- Synchronizes camera position and rotation from WorldTransform

#### WebGLRenderSystem
- Group: draw (last)
- Renders scene directly via WebGLRenderer (or through EffectComposer if postprocessing plugin is active)

### Functions

#### setCanvasElement(entity, canvas): void
Associates canvas with RenderContext
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Rendering Setup

```xml
<!-- Declarative scene with lighting and rendered objects -->
<world canvas="#game-canvas" sky="#87ceeb">
  <!-- Lighting (auto-created if omitted) -->
  <entity ambient-light directional-light></entity>

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
<!-- Combined lighting entity with custom properties -->
<entity
  ambient-light="sky-color: 0xffd4a3; ground-color: 0x808080; intensity: 0.4"
  directional-light="color: 0xffffff; intensity: 1.5; direction-x: -1; direction-y: 3; direction-z: -0.5; cast-shadow: 1; shadow-map-size: 2048"
></entity>

<!-- Or separate entities for independent control -->
<entity ambient-light="sky-color: 0xffd4a3; intensity: 0.4"></entity>
<entity directional-light="intensity: 1.5; direction-y: 3"></entity>
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
  sphere: 1
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

### Unlit Rendering

```xml
<!-- Emissive/unlit objects (not affected by lighting) -->
<entity renderer="shape: sphere; color: 0xffff00; unlit: 1"></entity>
```

### Orthographic Camera

```xml
<!-- Orthographic projection for 2D-style rendering -->
<camera main-camera="projection: orthographic; ortho-size: 20"></camera>

<!-- Perspective (default) with custom FOV -->
<camera main-camera="projection: perspective; fov: 60"></camera>
```

<!-- /LLM:EXAMPLES -->