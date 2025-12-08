# Validation Module

<!-- LLM:OVERVIEW -->
Zod-based runtime validation for XML recipes with helpful error messages.
<!-- /LLM:OVERVIEW -->

<!-- LLM:REFERENCE -->
### Functions
- `validateRecipeAttributes(recipeName, attributes)` - Validate recipe
- `validateXMLContent(xmlString, options?)` - Validate XML
- `formatZodError(error, context)` - Format errors

### Types
- `RecipeAttributes<T>` - Inferred recipe types
- `RecipeName` - Valid recipe names
<!-- /LLM:REFERENCE -->

<!-- LLM:EXAMPLES -->
```typescript
import { validateRecipeAttributes } from 'vibegame/core/validation';
const validated = validateRecipeAttributes('static-part', { pos: "0 5 0", shape: "box" });
```
<!-- /LLM:EXAMPLES -->
