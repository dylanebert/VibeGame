# Rendering Plugin

<!-- LLM:OVERVIEW -->
Three.js rendering with instanced meshes, lights, and cameras.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Components

**Renderer** - Visual mesh
- shape: ui8 (0=box, 1=sphere), sizeX/Y/Z: f32 (1)
- color: ui32 (0xffffff), visible: ui8 (1), unlit: ui8 (0)

**MainCamera**
- projection: ui8 (0=perspective, 1=orthographic)
- fov: f32 (75), orthoSize: f32 (10)

**AmbientLight**
- skyColor: ui32 (0x87ceeb), groundColor: ui32 (0x4a4a4a), intensity: f32 (0.6)

**DirectionalLight**
- color: ui32, intensity: f32 (1), castShadow: ui8 (1)
- directionX/Y/Z: f32, distance: f32 (30)

### Performance
- Instance pooling: starts 1000, doubles when full
- Warning at 10,000 instances, error at 50,000
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```xml
<!-- Rendered box -->
<renderer shape="box" color="#ff0000" pos="0 1 0"></renderer>

<!-- Custom lighting -->
<entity
  ambient-light="sky-color: 0xffd4a3; intensity: 0.4"
  directional-light="intensity: 1.5; direction-y: 3"
></entity>

<!-- Unlit (emissive) -->
<renderer shape="sphere" color="#ffff00" unlit="1"></renderer>

<!-- Orthographic camera -->
<camera main-camera="projection: orthographic; ortho-size: 20"></camera>
```
<!-- /LLM:EXAMPLES -->
