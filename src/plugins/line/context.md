# Line Plugin

<!-- LLM:OVERVIEW -->
2D billboard line rendering plugin using Three.js LineSegments2 for GPU-accelerated fat lines with consistent screen-space thickness. Uses batched rendering for performance - lines with matching material properties share a single draw call.
<!-- /LLM:OVERVIEW -->

## Layout

```
line/
├── context.md     # This file
├── index.ts       # Public exports
├── plugin.ts      # Plugin definition
├── components.ts  # Line component
├── systems.ts     # Batched line rendering system
└── utils.ts       # Batch management utilities
```

## Scope

- **In-scope**: Line rendering, arrowheads, thickness, opacity, visibility, batched rendering
- **Out-of-scope**: Dashed lines, curved lines, 3D tubes

## Entry Points

- **plugin.ts**: LinePlugin bundles component and system
- **systems.ts**: LineSystem executed each frame
- **index.ts**: Public API exports

## Dependencies

- **Internal**: Rendering plugin (scene), Transforms plugin (WorldTransform)
- **External**: Three.js, three/examples/jsm/lines/*

## Architecture

### Batched Rendering

Lines are grouped by material properties (thickness, opacity) into batches. Each batch uses a single `LineSegments2` with all line segments combined into one geometry. This reduces draw calls from N (one per line) to M (one per unique material configuration).

**Data flow**:
1. Query all line entities
2. Group by `(thickness, opacity)` key
3. Build position/color arrays for each group (including arrow segments)
4. Update batch geometry via `setPositions()` and `setColors()`
5. Dispose unused batches

### Segment Structure

Each visible line entity contributes:
- 1 segment for the main line
- 2 segments for start arrow (if enabled)
- 2 segments for end arrow (if enabled)

<!-- LLM:REFERENCE -->
### Components

#### Line
- offsetX: f32 (1) - End point X offset from entity position
- offsetY: f32 (0) - End point Y offset from entity position
- offsetZ: f32 (0) - End point Z offset from entity position
- color: ui32 (0xffffff) - Line color as hex
- thickness: f32 (2) - Line width in pixels
- opacity: f32 (1) - Line opacity 0-1
- visible: ui8 (1) - Visibility flag
- arrowStart: ui8 (0) - Draw arrow at start point
- arrowEnd: ui8 (0) - Draw arrow at end point
- arrowSize: f32 (0.2) - Arrow head size in world units

### Systems

#### LineSystem
- Group: draw
- Batches line segments by material properties
- Start position from WorldTransform, end from start + offset
- Includes arrow wing segments in batch geometry
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Line

```xml
<!-- Simple horizontal line -->
<entity transform="pos: 0 0 0" line="offset: 5 0 0"></entity>

<!-- Diagonal line with custom color -->
<entity transform="pos: 0 0 0" line="offset: 3 3 0; color: 0xff0000"></entity>
```

### Styled Line

```xml
<!-- Thick semi-transparent line -->
<entity
  transform="pos: 0 0 0"
  line="offset: 5 0 0; thickness: 5; opacity: 0.5">
</entity>

<!-- Line with arrow at end -->
<entity
  transform="pos: 0 0 0"
  line="offset: 0 5 0; arrow-end: 1; arrow-size: 0.3">
</entity>

<!-- Vector arrow (both ends) -->
<entity
  transform="pos: 0 0 0"
  line="offset: 4 2 0; arrow-start: 1; arrow-end: 1; arrow-size: 0.25; color: 0x00ff00">
</entity>
```

### Imperative Usage

```typescript
import { State } from 'vibegame';
import { Line, LinePlugin } from 'vibegame/line';
import { Transform, WorldTransform, TransformsPlugin } from 'vibegame/transforms';

const state = new State();
state.registerPlugin(TransformsPlugin);
state.registerPlugin(LinePlugin);

const lineEntity = state.createEntity();
state.addComponent(lineEntity, Transform);
state.addComponent(lineEntity, WorldTransform);
state.addComponent(lineEntity, Line);

Line.offsetX[lineEntity] = 5;
Line.offsetY[lineEntity] = 3;
Line.offsetZ[lineEntity] = 0;
Line.color[lineEntity] = 0xff0000;
Line.thickness[lineEntity] = 3;
Line.arrowEnd[lineEntity] = 1;
Line.arrowSize[lineEntity] = 0.3;
```
<!-- /LLM:EXAMPLES -->
