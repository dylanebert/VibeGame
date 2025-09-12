import type { z } from 'zod';
import type {
  vector3Schema,
  vector2Schema,
  colorSchema,
  shapeSchema,
  bodyTypeSchema,
  transformComponentSchema,
  bodyComponentSchema,
  colliderComponentSchema,
  rendererComponentSchema,
  orbitCameraComponentSchema,
  playerComponentSchema,
  entityRecipeSchema,
  staticPartRecipeSchema,
  dynamicPartRecipeSchema,
  kinematicPartRecipeSchema,
  playerRecipeSchema,
  cameraRecipeSchema,
  worldRecipeSchema,
  RecipeSchemas,
  RecipeName,
  RecipeAttributes,
} from './schemas';

export type Vector3 = z.infer<typeof vector3Schema>;
export type Vector2 = z.infer<typeof vector2Schema>;
export type Color = z.infer<typeof colorSchema>;
export type Shape = z.infer<typeof shapeSchema>;
export type BodyTypeValue = z.infer<typeof bodyTypeSchema>;

export type TransformComponent = z.infer<typeof transformComponentSchema>;
export type BodyComponent = z.infer<typeof bodyComponentSchema>;
export type ColliderComponent = z.infer<typeof colliderComponentSchema>;
export type RendererComponent = z.infer<typeof rendererComponentSchema>;
export type OrbitCameraComponent = z.infer<typeof orbitCameraComponentSchema>;
export type PlayerComponent = z.infer<typeof playerComponentSchema>;

export type EntityRecipe = z.infer<typeof entityRecipeSchema>;
export type StaticPartRecipe = z.infer<typeof staticPartRecipeSchema>;
export type DynamicPartRecipe = z.infer<typeof dynamicPartRecipeSchema>;
export type KinematicPartRecipe = z.infer<typeof kinematicPartRecipeSchema>;
export type PlayerRecipe = z.infer<typeof playerRecipeSchema>;
export type CameraRecipe = z.infer<typeof cameraRecipeSchema>;
export type WorldRecipe = z.infer<typeof worldRecipeSchema>;

export type { RecipeSchemas, RecipeName, RecipeAttributes };

export interface RecipeElements {
  entity: EntityRecipe;
  'static-part': StaticPartRecipe;
  'dynamic-part': DynamicPartRecipe;
  'kinematic-part': KinematicPartRecipe;
  player: PlayerRecipe;
  camera: CameraRecipe;
  world: WorldRecipe;
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidationOptions {
  filename?: string;
  lineNumber?: number;
  strict?: boolean;
}
