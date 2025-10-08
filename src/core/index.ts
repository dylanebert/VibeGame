export {
  addComponent,
  addEntity,
  createWorld,
  defineComponent,
  defineQuery,
  hasComponent,
  removeComponent,
  removeEntity,
  Types,
  type Component,
  type IWorld,
} from 'bitecs';

export {
  NULL_ENTITY,
  Parent,
  State,
  TIME_CONSTANTS,
  serializeComponent,
  deserializeComponent,
} from './ecs';
export type {
  ComponentDefaults,
  ComponentEnums,
  Config,
  EnumMapping,
  GameTime,
  Parser,
  Plugin,
  Recipe,
  ShorthandMapping,
  System,
  ValidationRule,
} from './ecs';
export { lerp, slerp, eulerToQuaternion, quaternionToEuler } from './math';
export {
  parseXMLToEntities,
  entityRecipe,
  fromEuler,
  type EntityCreationResult,
} from './recipes';
export { toCamelCase, toKebabCase } from './utils';
export {
  findElements,
  traverseElements,
  XMLParser,
  XMLValueParser,
} from './xml';
export type { ParsedElement, XMLValue } from './xml';

export {
  validateRecipeAttributes,
  safeValidateRecipeAttributes,
  validateXMLContent,
  validateHTMLContent,
  isValidRecipeName,
  getAvailableRecipeNames,
  getRecipeSchema,
} from './validation';

export type {
  Vector3,
  Vector2,
  Color,
  Shape,
  BodyTypeValue,
  RecipeName,
  RecipeAttributes,
  ValidationResult,
  ValidationOptions,
} from './validation';

export {
  registerRuntime,
  unregisterRuntime,
  disposeAllRuntimes,
} from './runtime-manager';
