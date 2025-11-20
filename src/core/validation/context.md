# Validation Module

<!-- LLM:OVERVIEW -->
Zod-based validation system for XML recipes with hierarchical rules and helpful error messages.
<!-- /LLM:OVERVIEW -->

## Purpose

- Define and enforce validation schemas for runtime
- Validate parsed XML elements at runtime
- Enforce parent-child relationships
- Generate TypeScript types from schemas
- Format errors with helpful suggestions

## Layout

```
validation/
├── context.md         # This file
├── schemas.ts         # Zod schema definitions
├── types.ts           # TypeScript type definitions
├── parser.ts          # Runtime validation parser
├── error-formatter.ts # Format Zod errors with diagnostics
└── index.ts           # Module exports
```

## Scope

- **In-scope**: Schema definitions, validation logic, error formatting, type generation
- **Out-of-scope**: Component implementation, XML parsing (uses core/xml)

## Entry Points

- **schemas.ts**: All Zod schema definitions
- **parser.ts**: Runtime validation functions

## Dependencies

- **Internal**: core/xml, plugins/recipes/diagnostics
- **External**: zod

<!-- LLM:REFERENCE -->
## API Reference

### Core Schemas

- `vector3Schema` - 3D vectors
- `colorSchema` - Color values
- `recipeSchemas` - All recipe validators including tween, pause, sequence
- `easingSchema` - Animation easings
- `loopModeSchema` - Animation loop modes

### Functions

- `validateRecipeAttributes(recipeName, attributes)` - Validate recipe
- `safeValidateRecipeAttributes(recipeName, attributes, options?)` - Safe validation with result
- `validateXMLContent(xmlString, options?)` - Validate XML
- `validateParsedElement(element, options?, parentTag?)` - Validate with hierarchy
- `isValidRecipeName(name)` - Check if recipe name exists
- `getRecipeSchema(recipeName)` - Get Zod schema for recipe
- `formatZodError(error, context)` - Format errors

### Types

- `RecipeAttributes<T>` - Inferred recipe types
- `RecipeName` - Valid recipe names
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
## Examples

### Runtime Validation

```typescript
import { validateRecipeAttributes } from 'vibegame/core/validation';

const attributes = {
  pos: "0 5 0",
  shape: "box",
  size: "1 1 1",
  color: "#ff0000"
};

const validated = validateRecipeAttributes('static-part', attributes);
// Returns parsed and validated attributes
```


### Type Generation

```typescript
import type { RecipeAttributes } from 'vibegame/core/validation';

type StaticPart = RecipeAttributes['static-part'];
// { pos: Vector3, shape: 'box' | 'sphere' | ..., size: Vector3, color: Color }
```
<!-- /LLM:EXAMPLES -->
