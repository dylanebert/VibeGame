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

#### Bloom
- intensity: f32 (1.0) - Bloom intensity
- luminanceThreshold: f32 (1.0) - Luminance threshold for bloom
- luminanceSmoothing: f32 (0.03) - Smoothness of luminance threshold
- mipmapBlur: ui8 (1) - Enable mipmap blur
- radius: f32 (0.85) - Blur radius for mipmap blur
- levels: ui8 (8) - Number of MIP levels for mipmap blur

#### Dithering
- colorBits: ui8 (4) - Bits per color channel (1-8)
- intensity: f32 (1.0) - Effect intensity (0-1)
- grayscale: ui8 (0) - Enable grayscale mode (0/1)
- scale: f32 (1.0) - Pattern scale (higher = coarser dithering)
- noise: f32 (1.0) - Noise threshold intensity

### Systems

#### MeshInstanceSystem
- Group: draw
- Synchronizes transforms with Three.js meshes

#### LightSyncSystem
- Group: draw
- Updates Three.js lights

#### CameraSyncSystem
- Group: draw
- Updates Three.js camera and manages post-processing effects

#### WebGLRenderSystem
- Group: draw (last)
- Renders scene through EffectComposer

### Functions

#### setCanvasElement(entity, canvas): void
Associates canvas with RenderContext

### Recipes

- ambient-light - Ambient hemisphere lighting
- directional-light - Directional light with shadows
- light - Both ambient and directional