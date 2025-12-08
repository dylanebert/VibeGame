# Transforms Plugin

<!-- LLM:OVERVIEW -->
3D transforms with position, rotation, scale, and parent-child hierarchies.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Components

**Transform** - Local space
- posX/Y/Z: f32 (0)
- rotX/Y/Z/W: f32 (W=1) - Quaternion
- eulerX/Y/Z: f32 (0) - Degrees
- scaleX/Y/Z: f32 (1)

**WorldTransform** - Auto-computed from hierarchy (read-only)
- Same properties as Transform
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```xml
<!-- Position and rotation -->
<entity transform="pos: 0 5 0; euler: 0 45 0; scale: 1.5"></entity>

<!-- Hierarchy (children relative to parent) -->
<entity transform="euler: 0 45 0">
  <entity transform="pos: 2 0 0"></entity>
</entity>
```

```typescript
// Direct property access
Transform.posX[entity] = 10;
Transform.eulerY[entity] = 45; // Auto-syncs to quaternion

// World position after parent transforms
const worldX = WorldTransform.posX[entity];
```
<!-- /LLM:EXAMPLES -->
