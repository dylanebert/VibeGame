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
  createSnapshot,
  formatSnapshot,
  NULL_ENTITY,
  Parent,
  State,
  TIME_CONSTANTS,
} from './ecs';
export type {
  Adapter,
  ComponentDefaults,
  ComponentEnums,
  Config,
  EntitySnapshot,
  EnumMapping,
  GameTime,
  Parser,
  ParserParams,
  Plugin,
  Recipe,
  ScreenCoordinate,
  SequenceSnapshot,
  ShorthandMapping,
  SnapshotOptions,
  System,
  ValidationRule,
  WorldSnapshot,
} from './ecs';
export { eulerToQuaternion, lerp, quaternionToEuler, slerp } from './math';
export {
  entityRecipe,
  fromEuler,
  ParseContext,
  parseXMLToEntities,
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
  getRecipeSchema,
  isValidRecipeName,
  safeValidateRecipeAttributes,
  validateHTMLContent,
  validateRecipeAttributes,
  validateXMLContent,
} from './validation';

export type {
  BodyTypeValue,
  Color,
  RecipeAttributes,
  RecipeName,
  Shape,
  ValidationOptions,
  ValidationResult,
  Vector2,
  Vector3,
} from './validation';

export {
  disposeAllRuntimes,
  registerRuntime,
  unregisterRuntime,
} from './runtime-manager';
