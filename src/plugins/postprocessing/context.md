# Postprocessing Plugin

<!-- LLM:OVERVIEW -->
Post-processing effects: bloom, dithering, SMAA, tonemapping. Requires explicit plugin registration.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Components

**Bloom**
- intensity: f32 (1.0), luminanceThreshold: f32 (1.0)
- mipmapBlur: ui8 (1), radius: f32 (0.85), levels: ui8 (8)

**Dithering**
- colorBits: ui8 (4), intensity: f32 (1.0), grayscale: ui8 (0)
- scale: f32 (1.0), noise: f32 (1.0)

**SMAA** - preset: ui8 (2) - 0=low, 1=medium, 2=high, 3=ultra

**Tonemapping**
- mode: ui8 (7) - 0=linear, 7=aces-filmic, etc.

### Tonemapping Modes
0: linear, 1: reinhard, 4: uncharted2, 7: aces-filmic (default), 8: agx, 9: neutral
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```typescript
import { PostprocessingPlugin } from 'vibegame/postprocessing';
GAME.withPlugin(PostprocessingPlugin).run();
```

```xml
<orbit-camera bloom="intensity: 2; luminance-threshold: 0.8"></orbit-camera>
<orbit-camera dithering="color-bits: 3; scale: 2"></orbit-camera>
<orbit-camera bloom="intensity: 1.5" tonemapping="mode: aces-filmic"></orbit-camera>
```
<!-- /LLM:EXAMPLES -->
