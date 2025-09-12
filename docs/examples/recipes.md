# Recipes Examples

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