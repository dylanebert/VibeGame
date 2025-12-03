# Text Plugin

<!-- LLM:OVERVIEW -->
3D text rendering plugin using troika-three-text for SDF-based text in Three.js scenes.
<!-- /LLM:OVERVIEW -->

## Layout

```
text/
├── context.md     # This file
├── index.ts       # Public exports
├── plugin.ts      # Plugin definition
├── components.ts  # Text component
├── systems.ts     # Text rendering system
├── parser.ts      # XML text attribute parser
├── utils.ts       # Context and content management
└── types.d.ts     # TypeScript declarations for troika-three-text
```

## Scope

- **In-scope**: 3D text rendering, text content, basic typography
- **Out-of-scope**: Custom fonts, rich text, billboarding

## Entry Points

- **plugin.ts**: TextPlugin bundles component and system
- **systems.ts**: TextSystem executed each frame
- **index.ts**: Public API exports

## Dependencies

- **Internal**: Rendering plugin (scene), Transforms plugin (WorldTransform)
- **External**: troika-three-text, Three.js

<!-- LLM:REFERENCE -->
### Components

#### Text
- fontSize: f32 (1) - Font size in world units
- color: ui32 (0xffffff) - Text color as hex
- anchorX: ui8 (1) - Horizontal anchor (0=left, 1=center, 2=right)
- anchorY: ui8 (1) - Vertical anchor (0=top, 1=middle, 2=bottom)
- textAlign: ui8 (0) - Text alignment (0=left, 1=center, 2=right, 3=justify)
- maxWidth: f32 (0) - Max width before wrapping (0=no limit)
- lineHeight: f32 (1.2) - Line height multiplier
- dirty: ui8 (1) - Sync flag (internal)

### Systems

#### TextSystem
- Group: draw
- Creates and syncs troika Text meshes with component data
- Positions text using WorldTransform
- Cleans up meshes when entities are removed

### Utility Functions

#### setTextContent(state, entity, text)
Sets the text content for a text entity (required since bitECS only supports numeric types)

#### getTextContent(state, entity)
Gets the text content for a text entity
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Text

```xml
<!-- Simple centered text -->
<entity transform="pos: 0 2 0" text="text: Hello World"></entity>

<!-- Positioned text with custom size -->
<entity transform="pos: 5 3 0" text="text: Score; font-size: 2"></entity>
```

### Styled Text

```xml
<!-- Red text aligned right -->
<entity
  transform="pos: 0 2 0"
  text="text: Warning; font-size: 1.5; color: 0xff0000; anchor-x: right">
</entity>

<!-- Multi-line centered text with max width -->
<entity
  transform=""
  text="text: This is a long text that will wrap; max-width: 10; text-align: center">
</entity>
```

### Imperative Usage

```typescript
import { State } from 'vibegame';
import { Text, TextPlugin, setTextContent } from 'vibegame/text';
import { Transform, WorldTransform, TransformsPlugin } from 'vibegame/transforms';

const state = new State();
state.registerPlugin(TransformsPlugin);
state.registerPlugin(TextPlugin);

const textEntity = state.createEntity();
state.addComponent(textEntity, Transform);
state.addComponent(textEntity, WorldTransform);
state.addComponent(textEntity, Text);

setTextContent(state, textEntity, 'Hello World');
Text.fontSize[textEntity] = 2;
Text.color[textEntity] = 0x00ff00;
Text.dirty[textEntity] = 1;
```
<!-- /LLM:EXAMPLES -->
