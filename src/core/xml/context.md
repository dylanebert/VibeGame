# XML Module

<!-- LLM:OVERVIEW -->
Declarative entity creation through XML parsing. Converts A-frame style XML into ECS entities with type-safe attribute parsing for vectors, colors, and other values.
<!-- /LLM:OVERVIEW -->

## Purpose

- Parse XML strings/elements to ECS entities
- Support A-frame style declarative syntax
- Handle attributes and nested structures
- Type-safe value parsing

## Layout

```
xml/
├── context.md  # This file
├── parser.ts  # Main XML parser
├── traverser.ts  # DOM tree traversal
├── types.ts  # XML parsing types
├── values.ts  # Attribute value parsing
└── index.ts  # Module exports
```

## Scope

- **In-scope**: XML to entity conversion, attribute parsing
- **Out-of-scope**: Component logic, rendering

## Entry Points

- **parser.ts**: XMLParser class for entity creation
- **traverser.ts**: Tree traversal utilities
- **values.ts**: Parse vectors, colors, numbers

## Dependencies

- **Internal**: ECS types
- **External**: DOM API

<!-- LLM:REFERENCE -->
## API Reference

### XMLParser

- `XMLParser.parse(xmlString: string): XMLParseResult` - Parse XML string into element tree

### Traversal Functions

- `traverseElements(element: ParsedElement, callback: (el: ParsedElement) => void): void` - Traverse element tree
- `findElements(element: ParsedElement, predicate: (el: ParsedElement) => boolean): ParsedElement[]` - Find matching elements

### XMLValueParser

- `XMLValueParser.parse(value: string): XMLValue` - Parse attribute values into appropriate types
  - Numbers: `"42"` → `42`
  - Booleans: `"true"` → `true`
  - Vectors: `"1 2 3"` → `[1, 2, 3]`
  - Hex colors: `"0xff0000"` → `16711680`
  - Strings: `"text"` → `"text"`

### Types

```typescript
interface ParsedElement {
  tagName: string;                       // Lowercase tag name
  attributes: Record<string, XMLValue>;  // Parsed attributes
  children: ParsedElement[];             // Child elements
}

type XMLValue = string | number | boolean | number[];

interface XMLParseResult {
  root: ParsedElement;                   // Root element
}
```
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic XML Parsing

```typescript
import * as GAME from 'vibegame';

const xml = `
  <world>
    <entity pos="0 1 0" euler="0 45 0">
      <box size="1 1 1" color="#ff0000"></box>
      <rigidbody type="dynamic"></rigidbody>
    </entity>
  </world>
`;

const result = GAME.XMLParser.parse(xml);
// result.root.tagName === 'world'
// result.root.children[0].tagName === 'entity'
// result.root.children[0].attributes.pos === [0, 1, 0]
```

### Traversing Elements

```typescript
import * as GAME from 'vibegame';

GAME.traverseElements(result.root, (element) => {
  if (element.tagName === 'entity') {
    console.log('Found entity:', element.attributes);
  }
});
```

### Value Parsing

```typescript
import * as GAME from 'vibegame';

GAME.XMLValueParser.parse("42");           // 42
GAME.XMLValueParser.parse("true");         // true
GAME.XMLValueParser.parse("1 2 3");        // [1, 2, 3]
GAME.XMLValueParser.parse("0xff0000");     // 16711680
GAME.XMLValueParser.parse("hello world");  // "hello world"
```
<!-- /LLM:EXAMPLES -->
