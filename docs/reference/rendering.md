# Rendering Reference

### Components

#### Renderer
- shape: ui8 - 0=box, 1=sphere, 2=cylinder, 3=plane
- sizeX, sizeY, sizeZ: f32 (1)
- color: ui32 (0xffffff)
- visible: ui8 (1)

#### RenderContext
- clearColor: ui32 (0x000000)
- hasCanvas: ui8

#### MainCamera
Tag component (no properties)

#### Ambient
- skyColor: ui32 (0x87ceeb)
- groundColor: ui32 (0x4a4a4a)
- intensity: f32 (0.6)

#### Directional
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
- Updates Three.js camera

#### WebGLRenderSystem
- Group: draw (last)
- Renders scene to canvas

### Functions

#### setCanvasElement(entity, canvas): void
Associates canvas with RenderContext

### Recipes

- ambient-light - Ambient hemisphere lighting
- directional-light - Directional light with shadows
- light - Both ambient and directional