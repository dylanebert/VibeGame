# Postprocessing Plugin

<!-- LLM:OVERVIEW -->
Post-processing effects layer using the postprocessing library for Three.js rendering.
<!-- /LLM:OVERVIEW -->

## Layout

```
postprocessing/
├── context.md  # This file
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # Postprocessing components
├── systems.ts  # Postprocessing systems
├── utils.ts  # Context management utilities
└── effects/
    └── dithering-effect.ts  # Custom dithering effect
```

## Scope

- **In-scope**: Post-processing effects (bloom, dithering, tonemapping)
- **Out-of-scope**: Base rendering, meshes, lighting (handled by rendering plugin)

## Entry Points

- **plugin.ts**: PostprocessingPlugin bundles all components and systems
- **systems.ts**: Postprocessing systems executed each frame
- **index.ts**: Public API exports

## Dependencies

- **Internal**: Rendering plugin (renderer, scene, cameras), Transforms plugin (MainCamera, WorldTransform)
- **External**: postprocessing library, Three.js

<!-- LLM:REFERENCE -->
### Components

#### Bloom
- intensity: f32 (1.0) - Bloom intensity
- luminanceThreshold: f32 (1.0) - Luminance threshold for bloom
- mipmapBlur: ui8 (1) - Enable mipmap blur
- radius: f32 (0.85) - Blur radius for mipmap blur
- levels: ui8 (8) - Number of MIP levels for mipmap blur

#### Dithering
- colorBits: ui8 (4) - Bits per color channel (1-8)
- intensity: f32 (1.0) - Effect intensity (0-1)
- grayscale: ui8 (0) - Enable grayscale mode (0/1)
- scale: f32 (1.0) - Pattern scale (higher = coarser dithering)
- noise: f32 (1.0) - Noise threshold intensity

#### SMAA
- preset: ui8 (2) - Anti-aliasing quality (0=low, 1=medium, 2=high, 3=ultra)

#### Tonemapping
- mode: ui8 (7) - Tonemapping mode (0-9)
- middleGrey: f32 (0.6) - Middle grey value
- whitePoint: f32 (4.0) - White point
- averageLuminance: f32 (1.0) - Average luminance
- adaptationRate: f32 (1.0) - Adaptation rate

### Systems

#### PostprocessingSystem
- Group: draw
- Manages EffectComposer and rebuilds effect passes based on components

#### PostprocessingRenderSystem
- Group: draw (last)
- Renders scene through EffectComposer with effects

### Tonemapping Modes

- 0: linear
- 1: reinhard
- 2: reinhard2
- 3: reinhard2-adaptive
- 4: uncharted2
- 5: optimized-cineon
- 6: cineon
- 7: aces-filmic (default)
- 8: agx
- 9: neutral
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Bloom Effect

```xml
<!-- Camera with bloom effect (using defaults) -->
<camera bloom></camera>

<!-- Camera with custom bloom settings -->
<camera bloom="intensity: 2; luminance-threshold: 0.8"></camera>

<!-- Camera with mipmap blur settings -->
<camera bloom="mipmap-blur: 1; radius: 0.9; levels: 10"></camera>
```

### Dithering Effect

```xml
<!-- Camera with retro dithering effect -->
<camera dithering="color-bits: 3; intensity: 0.8; scale: 2"></camera>

<!-- Subtle dithering for vintage look -->
<camera dithering="color-bits: 5; intensity: 0.5; scale: 1"></camera>

<!-- Coarse pixel-art style dithering -->
<camera dithering="color-bits: 2; scale: 4; intensity: 1"></camera>

<!-- Grayscale dithering -->
<camera dithering="grayscale: 1; color-bits: 4"></camera>
```

### SMAA Anti-Aliasing

```xml
<!-- Default SMAA (high quality) -->
<camera smaa></camera>

<!-- Ultra quality SMAA -->
<camera smaa="preset: ultra"></camera>
```

### Combined Effects

```xml
<!-- Combined bloom and dithering for retro aesthetic -->
<camera bloom="intensity: 1.5" dithering="color-bits: 2; grayscale: 1; scale: 3"></camera>

<!-- Bloom with SMAA -->
<camera bloom="intensity: 2" smaa="preset: high"></camera>
```

### Imperative Usage

```typescript
import * as GAME from 'vibegame';

// Add bloom to camera entity
const cameraEntity = state.createEntity();
state.addComponent(cameraEntity, GAME.MainCamera);
state.addComponent(cameraEntity, GAME.Bloom, {
  intensity: 1.5,
  luminanceThreshold: 0.9,
});

// Add dithering
state.addComponent(cameraEntity, GAME.Dithering, {
  colorBits: 4,
  intensity: 0.8,
  scale: 2,
});

// Remove effects
state.removeComponent(cameraEntity, GAME.Bloom);
```
<!-- /LLM:EXAMPLES -->
