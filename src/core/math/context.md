# Math Module

<!-- LLM:OVERVIEW -->
Math utilities for interpolation and 3D transformations.
<!-- /LLM:OVERVIEW -->

## Purpose

- Vector and quaternion operations
- Interpolation utilities
- Common math constants
- Transformation helpers

## Layout

```
math/
├── context.md  # This file
├── utilities.ts  # Math utility functions
└── index.ts  # Module exports
```

## Scope

- **In-scope**: 3D math, interpolation, transforms
- **Out-of-scope**: Physics calculations, rendering math

## Entry Points

- **utilities.ts**: Math utility functions
- **index.ts**: Public exports

## Dependencies

- **Internal**: None
- **External**: Three.js math types

<!-- LLM:REFERENCE -->
### Functions

#### lerp(a, b, t): number
Linear interpolation

#### slerp(fromX, fromY, fromZ, fromW, toX, toY, toZ, toW, t): Quaternion
Quaternion spherical interpolation
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Usage Note

Math utilities are used internally by systems like tweening and transforms. For animating properties, use the Tween system instead of directly calling interpolation functions. For transformations, use the Transform component's euler angles which are automatically converted to quaternions by the system.
<!-- /LLM:EXAMPLES -->