# Line Plugin

<!-- LLM:OVERVIEW -->
2D billboard line rendering with GPU-accelerated fat lines. Batched rendering for performance.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Components

**Line**
- offsetX/Y/Z: f32 (1/0/0) - End point offset from entity
- color: ui32 (0xffffff), thickness: f32 (2), opacity: f32 (1)
- visible: ui8 (1)
- arrowStart/End: ui8 (0), arrowSize: f32 (0.2)
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```typescript
import { LinePlugin } from 'vibegame/line';
GAME.withPlugin(LinePlugin).run();
```

```xml
<entity transform line="offset: 5 0 0"></entity>
<entity transform line="offset: 3 2 0; color: 0xff0000; arrow-end: 1; arrow-size: 0.3"></entity>
```
<!-- /LLM:EXAMPLES -->
