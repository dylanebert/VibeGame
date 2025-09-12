# Transforms Reference

### Components

#### Transform
- posX, posY, posZ: f32 (0)
- rotX, rotY, rotZ, rotW: f32 (rotW=1) - Quaternion
- eulerX, eulerY, eulerZ: f32 (0) - Degrees
- scaleX, scaleY, scaleZ: f32 (1)

#### WorldTransform
- Same properties as Transform
- Auto-computed from hierarchy (read-only)

### Systems

#### TransformHierarchySystem
- Group: simulation (last)
- Syncs euler/quaternion and computes world transforms