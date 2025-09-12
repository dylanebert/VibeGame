# Orbit Camera Reference

### Components

#### OrbitCamera
- target: eid (0) - Target entity ID
- current-yaw: f32 (π) - Current horizontal angle
- current-pitch: f32 (π/6) - Current vertical angle
- current-distance: f32 (4) - Current distance
- target-yaw: f32 (π) - Target horizontal angle
- target-pitch: f32 (π/6) - Target vertical angle
- target-distance: f32 (4) - Target distance
- min-distance: f32 (1)
- max-distance: f32 (25)
- min-pitch: f32 (0)
- max-pitch: f32 (π/2)
- smoothness: f32 (0.5) - Interpolation speed
- offset-x: f32 (0)
- offset-y: f32 (1.25)
- offset-z: f32 (0)

### Systems

#### OrbitCameraSystem
- Group: draw
- Updates camera position and rotation around target

### Recipes

#### camera
- Creates orbital camera with default settings
- Components: orbit-camera, transform, world-transform, main-camera