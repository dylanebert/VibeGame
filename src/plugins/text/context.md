# Text Plugin

<!-- LLM:OVERVIEW -->
3D text rendering with troika-three-text. Paragraph/Word hierarchy for layout. Supports headless mode via injectable measurement function (see CLI module).
<!-- /LLM:OVERVIEW -->

## Layout

```
text/
├── context.md
├── index.ts
├── plugin.ts
├── components.ts
├── recipes.ts
├── systems.ts
├── utils.ts
└── types.d.ts
```

## Scope

- **In-scope**: 3D text, paragraph/word layout, troika effects
- **Out-of-scope**: Per-character animation, rich text

## Dependencies

- **Internal**: Core ECS (Parent), Rendering (scene), Transforms
- **External**: troika-three-text

<!-- LLM:REFERENCE -->
### Components

#### Paragraph
- gap: f32 (0.2) - Space between words
- align: ui8 (1) - 0=left, 1=center, 2=right
- anchorX/anchorY: ui8 (1) - Text anchor
- damping: f32 (0) - Position smoothing (0=instant)

#### Word
- fontSize, color, letterSpacing, lineHeight
- outlineWidth/Color/Blur/OffsetX/OffsetY/Opacity
- strokeWidth/Color/Opacity, fillOpacity, curveRadius
- width (internal), dirty (internal)

### Systems

- **WordRenderSystem** (draw): Creates troika meshes (skips in headless)
- **WordMeasureSystem** (draw): Measures word width via injectable `measureFn`
- **ParagraphArrangeSystem** (simulation): Positions words in paragraph

### Headless

Use `setMeasureFn(state, fn)` to inject custom measurement. CLI module provides `setHeadlessFont()` for Typr.js-based measurement.
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

```xml
<word text="Hello" font-size="2" color="#ff0000"></word>

<paragraph gap="0.3" align="center">
  <word text="Hello" color="#ff4444"></word>
  <word text="World" color="#44ff44"></word>
</paragraph>
```
<!-- /LLM:EXAMPLES -->
