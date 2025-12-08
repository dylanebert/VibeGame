# CLI Module

<!-- LLM:OVERVIEW -->
Headless state creation, XML parsing, text measurement, snapshot, and query utilities for Node.js/Bun. Enables AI testing and video creation without browser/WebGL.
<!-- /LLM:OVERVIEW -->

## Layout

```
cli/
├── context.md
├── index.ts       # Public exports
├── headless.ts    # Headless state creation
├── snapshot.ts    # World snapshot with viewport projection
├── queries.ts     # Entity/sequence query utilities
└── text.ts        # Typr.js text measurement
```

## Scope

- **In-scope**: Headless state, XML parsing, DOM polyfills, text measurement, entity discovery, sequence inspection, world snapshots, viewport projection
- **Out-of-scope**: Rendering, WebGL, browser-only features

## Dependencies

- **Internal**: Core ECS (State), XML parser, TextPlugin, TweenPlugin, RenderingPlugin (for projection)
- **External**: jsdom, @fredli74/typr, three (for projection math)

<!-- LLM:REFERENCE -->
### Headless State

- `createHeadlessState(options)` - Creates State with `headless=true`
- `parseWorldXml(state, xml, options?)` - Parses XML string, creates entities
- `loadWorldFromFile(state, path)` - Loads XML from file

ParseOptions:
- `ignoreUnknownAttributes?: string[]` - Skip validation for specified attributes

### Text Measurement

- `loadFont(path)` - Loads TTF/OTF font
- `setHeadlessFont(state, font)` - Injects font for Word.width
- `measureTextWidth(font, text, fontSize)` - Pure text width calculation

### Entity Discovery

- `getEntityNames(state)` - All named entity names (sorted)
- `queryEntities(state, ...componentNames)` - Entity IDs by component
- `hasComponentByName(state, eid, name)` - Check if entity has component by name
- `getComponentData(state, eid, componentName)` - Get component field values
- `getEntityData(state, eid)` - Get all component data for entity

### Sequence Inspection

- `getSequenceInfo(state, name)` - Sequence state by name
- `getAllSequences(state)` - All sequences with state/progress

### Snapshot

- `createSnapshot(state, options?)` - Creates world snapshot
- `formatSnapshot(snapshot)` - Human-readable text format
- `toJSON(snapshot, options?)` - Structured JSON output

SnapshotOptions:
- `entities?: string[]` - Filter by entity names
- `components?: string[]` - Filter by component names
- `sequences?: boolean` - Include sequence state (default: true)
- `project?: boolean` - Include viewport projection (default: true)
- `detail?: 'brief' | 'standard' | 'full'` - Output verbosity (default: 'standard')
- `precision?: number` - Decimal places for floats (default: 2)

ToJSONOptions:
- `compact?: boolean` - Omit indentation

Viewport: `{ x, y, z, visible }` - normalized 0-1, (0,0) top-left.
Hints: `{ type, entity?, message }` - contextual warnings/info.
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

```typescript
import {
  createHeadlessState, loadFont, parseWorldXml, setHeadlessFont,
  getEntityNames, getAllSequences, createSnapshot, toJSON
} from 'vibegame/cli';
import { playSequence, resetSequence } from 'vibegame/tweening';

// Setup
const font = await loadFont('./font.ttf');
const state = createHeadlessState({ plugins: [TransformsPlugin, TweenPlugin, TextPlugin] });
setHeadlessFont(state, font);
parseWorldXml(state, xmlContent);

// Discover entities and sequences
const names = getEntityNames(state);
const sequences = getAllSequences(state);

// Step and snapshot (viewport projection included by default)
state.step(0);
console.log(toJSON(createSnapshot(state, { entities: names })));

// Play sequence, step frames
const seq = state.getEntityByName('intro');
resetSequence(state, seq);
playSequence(state, seq);
for (let i = 0; i < 60; i++) state.step(1/60);

state.dispose();
```
<!-- /LLM:EXAMPLES -->

## AI Usage Patterns

### Quick State Check (Default)
```typescript
// Brief overview with hints - start here
toJSON(createSnapshot(state))
```

Output includes: named entities, sequence states, viewport positions, contextual hints. Floats truncated to 2 decimals.

### Detail Tiers

| Tier | Use Case | What's Included |
|------|----------|-----------------|
| `brief` | Quick context | Entity names, summaries, viewport, sequences, hints |
| `standard` | Debugging | Above + key component values (no internal components) |
| `full` | Deep inspection | All components including internal, unnamed entities |

```typescript
// Standard (default) - component values visible
toJSON(createSnapshot(state, { detail: 'standard' }))

// Full - includes world-transform, parent/children, unnamed entities
toJSON(createSnapshot(state, { detail: 'full' }))
```

### Debug Specific Entity
```typescript
toJSON(createSnapshot(state, {
  entities: ['player'],
  detail: 'full',
  precision: 4
}))
```

### Track Sequence Progress
```typescript
getAllSequences(state) // All sequences with state/progress
getSequenceInfo(state, 'intro') // Single sequence details
```

### Hints System

Snapshots include contextual hints to guide attention:

| Hint Type | Trigger | Example |
|-----------|---------|---------|
| `warning` | Entity behind camera | `'player' behind camera` |
| `warning` | Entity near screen edge | `'enemy' near right edge` |
| `sequence` | Sequence playing | `'intro' playing (45%)` |
| `info` | Sequence nearly done | `'intro' nearly complete` |

### Precision Control

Default precision is 2 decimal places. Override when needed:

```typescript
createSnapshot(state, { precision: 0 }) // Integers only
createSnapshot(state, { precision: 4 }) // High precision for debugging
```
