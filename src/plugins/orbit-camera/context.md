# Orbit Camera Plugin

<!-- LLM:OVERVIEW -->
Standalone orbital camera with mouse look and scroll zoom for third-person views.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Components

**OrbitCamera**
- target: eid (0) - Entity to orbit
- inputSource: eid (0) - Entity with InputState
- currentYaw/Pitch/Distance: f32 - Current values
- targetYaw/Pitch/Distance: f32 - Target values
- minDistance/maxDistance: f32 (1/25)
- smoothness: f32 (0.5)
- offsetX/Y/Z: f32 (0/1.25/0)
- sensitivity: f32 (0.007), zoomSensitivity: f32 (1.5)

### Recipe
- `<orbit-camera>` - Camera with auto-setup for target and input
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```xml
<!-- Auto-creates target and links to player -->
<orbit-camera></orbit-camera>

<!-- Custom settings -->
<orbit-camera target-distance="10" min-distance="5" max-distance="20" offset-y="2"></orbit-camera>
```

```typescript
// Switch target dynamically
OrbitCamera.target[cameraEntity] = newTargetEntity;
```
<!-- /LLM:EXAMPLES -->
