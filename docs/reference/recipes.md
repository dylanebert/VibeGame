# Recipes Reference

### Components

#### Parent
- entity: i32 - Parent entity ID

### Functions

#### parseXMLToEntities(state, xmlContent): EntityCreationResult[]
Converts XML elements to ECS entities with hierarchy

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