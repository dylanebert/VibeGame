# XML Module

<!-- LLM:OVERVIEW -->
A-frame style declarative XML to ECS entities with type-safe attribute parsing.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Functions
- `XMLParser.parse(xmlString): XMLParseResult` - Parse XML to element tree
- `XMLValueParser.parse(value)` - Parse attributes: numbers, booleans, vectors (`"1 2 3"`), hex colors (`"0xff0000"`)

### Types
```typescript
interface ParsedElement {
  tagName: string;
  attributes: Record<string, XMLValue>;
  children: ParsedElement[];
}
type XMLValue = string | number | boolean | number[];
```
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```typescript
const result = GAME.XMLParser.parse('<entity pos="0 1 0" color="#ff0000"></entity>');
// result.root.attributes.pos === [0, 1, 0]
// result.root.attributes.color === 16711680
```
<!-- /LLM:EXAMPLES -->
