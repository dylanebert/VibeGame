# Recipes Plugin

XML recipe system for declarative entity creation

<!-- LLM:OVERVIEW -->
Foundation for declarative XML entity creation with parent-child hierarchies and attribute shorthands.
<!-- /LLM:OVERVIEW -->

## Layout

```
recipes/
context.md  # This file, folder context (Tier 2)
├── index.ts  # Public exports
├── plugin.ts  # Plugin definition
├── components.ts  # Parent component
├── recipes.ts  # Base entity recipe
├── parser.ts  # XML to entity parser
├── property-parser.ts  # Attribute parsing
├── shorthand-expander.ts  # Shorthand expansion
├── diagnostics.ts  # Error reporting
├── types.ts  # Recipe types
└── utils.ts  # Recipe utilities
```

## Scope

- **In-scope**: XML parsing, entity creation from recipes, parent-child relationships, attribute parsing with shorthands, property validation, error diagnostics
- **Out-of-scope**: Component logic implementation, rendering, physics simulation, game logic

## Entry Points

- **parseXMLToEntities**: Called by the core XML system to convert parsed XML elements into entities
- **createEntityFromRecipe**: Called internally and by other plugins to create entities from recipe definitions
- **RecipePlugin**: Registered during game initialization to enable the recipe system
- **fromEuler**: Utility called when converting Euler angles to quaternions

## Dependencies

- **Internal**: Core ECS system, XML parser, Transform plugin (for hierarchies), all component plugins (for recipe attributes)
- **External**: bitECS, Three.js (for Euler/Quaternion conversions), DOM API

<!-- LLM:REFERENCE -->
### Components

#### Parent
- entity: i32 - Parent entity ID

### Functions

#### parseXMLToEntities(state, xmlContent, options?): EntityCreationResult[]
Converts XML elements to ECS entities with hierarchy

#### ParseOptions
- `ignoreUnknownAttributes?: string[]` - Skip validation for specified attributes

#### createEntityFromRecipe(state, recipeName, attributes?): number
Creates entity from recipe with attributes

#### fromEuler(x, y, z): Quaternion
Converts Euler angles (radians) to quaternion

### Types

#### EntityCreationResult
- entity: number - Entity ID
- tagName: string - Recipe name
- children: EntityCreationResult[]

### Recipes

#### entity
- Base recipe with no default components

### Property Formats

- Single value: `transform="scale: 2"`
- Vector3: `transform="pos: 0 5 -3"`
- Broadcast: `transform="scale: 2"` → scale: 2 2 2
- Euler angles: `transform="euler: 0 45 0"` (degrees)
- Multiple: `transform="pos: 0 5 0; euler: 0 45 0"`
- Shorthands: `pos="0 5 0"` → transform component
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Basic Entity Creation

```xml
<!-- Create a basic entity with no components -->
<entity></entity>

<!-- Entity with transform component -->
<entity transform="pos: 0 5 0"></entity>

<!-- Entity with multiple components -->
<entity 
  transform="pos: 0 5 0; euler: 0 45 0"
  renderer="shape: box; color: 0xff0000"
/>
```

### Using Shorthands

```xml
<!-- Position shorthand expands to transform component -->
<entity pos="0 5 0"></entity>

<!-- Multiple shorthands -->
<entity 
  pos="0 5 0"
  euler="0 45 0"
  scale="2"
  color="#ff0000"
/>
```

### Parent-Child Hierarchies

```xml
<!-- Parent with children -->
<entity transform="pos: 0 0 0">
  <!-- Children inherit parent transform -->
  <entity transform="pos: 2 0 0"></entity>
  <entity transform="pos: -2 0 0"></entity>
</entity>

<!-- Nested hierarchy -->
<entity id="root" transform>
  <entity id="arm" transform="pos: 0 2 0">
    <entity id="hand" transform="pos: 0 2 0"></entity>
  </entity>
</entity>
```

### JavaScript API Usage

```typescript
import * as GAME from 'vibegame';

// Create entity from recipe
const entity = GAME.createEntityFromRecipe(state, 'entity', {
  pos: '0 5 0',
  color: '0xff0000'
});

// Parse XML to entities
const xmlElement = {
  tagName: 'entity',
  attributes: { transform: 'pos: 0 5 0' },
  children: []
};
const results = GAME.parseXMLToEntities(state, xmlElement);

// Convert Euler to quaternion
const quat = GAME.fromEuler(0, Math.PI / 4, 0);  // 45 degrees on Y
```

### Error Handling

```typescript
import * as GAME from 'vibegame';

try {
  // This will throw with helpful message
  GAME.createEntityFromRecipe(state, 'unkown-recipe', {});
} catch (error) {
  console.error(error.message);
  // Output: Unknown element <unkown-recipe> - did you mean <unknown-recipe>?
  // Available recipes: entity, static-part, dynamic-part...
}
```

### Custom Component Properties

```xml
<!-- Component with enum values -->
<entity body="type: dynamic"></entity>

<!-- Vector properties with broadcast -->
<entity transform="scale: 2"></entity>  <!-- All axes set to 2 -->

<!-- Rotation using euler angles (degrees) -->
<entity transform="euler: 0 45 0"></entity>
```
<!-- /LLM:EXAMPLES -->