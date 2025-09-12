import { z } from 'zod';

const numberSchema = z.number();

const numberStringSchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/)
  .transform((val) => parseFloat(val));

const booleanSchema = z.union([
  z.boolean(),
  z.literal('true').transform(() => true),
  z.literal('false').transform(() => false),
  z.literal(1).transform(() => true),
  z.literal(0).transform(() => false),
]);

export const vector3Schema = z.union([
  z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  numberSchema.transform((val) => ({ x: val, y: val, z: val })),
  numberStringSchema.transform((val) => ({ x: val, y: val, z: val })),
  z
    .string()
    .regex(/^-?\d+(\.\d+)?\s+-?\d+(\.\d+)?\s+-?\d+(\.\d+)?$/)
    .transform((val) => {
      const [x, y, z] = val.split(/\s+/).map(Number);
      return { x, y, z };
    }),
]);

export const vector2Schema = z.union([
  z.object({
    x: z.number(),
    y: z.number(),
  }),
  numberSchema.transform((val) => ({ x: val, y: val })),
  numberStringSchema.transform((val) => ({ x: val, y: val })),
  z
    .string()
    .regex(/^-?\d+(\.\d+)?\s+-?\d+(\.\d+)?$/)
    .transform((val) => {
      const [x, y] = val.split(/\s+/).map(Number);
      return { x, y };
    }),
]);

export const colorSchema = z.union([
  z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .transform((val) => parseInt(val.slice(1), 16)),
  z
    .string()
    .regex(/^0x[0-9a-fA-F]{6}$/)
    .transform((val) => parseInt(val.slice(2), 16)),
  numberSchema,
  numberStringSchema,
]);

export const shapeSchema = z.enum([
  'box',
  'sphere',
  'cylinder',
  'capsule',
  'cone',
  'torus',
  'plane',
]);

export const bodyTypeSchema = z.enum(['static', 'dynamic', 'kinematic']);

export const transformComponentSchema = z
  .object({
    pos: vector3Schema.optional(),
    scale: vector3Schema.optional(),
    euler: vector3Schema.optional(),
    rot: z.never().optional(),
  })
  .strict();

export const bodyComponentSchema = z
  .object({
    type: bodyTypeSchema.optional(),
    pos: vector3Schema.optional(),
    euler: vector3Schema.optional(),
    mass: numberSchema.optional(),
    'linear-damping': numberSchema.optional(),
    'angular-damping': numberSchema.optional(),
    'gravity-scale': numberSchema.optional(),
  })
  .strict();

export const colliderComponentSchema = z
  .object({
    shape: shapeSchema.optional(),
    size: vector3Schema.optional(),
    restitution: numberSchema.optional(),
    friction: numberSchema.optional(),
    density: numberSchema.optional(),
    sensor: booleanSchema.optional(),
  })
  .strict();

export const rendererComponentSchema = z
  .object({
    shape: shapeSchema.optional(),
    size: vector3Schema.optional(),
    color: colorSchema.optional(),
    'cast-shadow': booleanSchema.optional(),
    'receive-shadow': booleanSchema.optional(),
    visible: booleanSchema.optional(),
  })
  .strict();

export const orbitCameraComponentSchema = z
  .object({
    distance: numberSchema.optional(),
    'min-distance': numberSchema.optional(),
    'max-distance': numberSchema.optional(),
    'min-pitch': numberSchema.optional(),
    'max-pitch': numberSchema.optional(),
    'target-pitch': numberSchema.optional(),
    'target-yaw': numberSchema.optional(),
    sensitivity: numberSchema.optional(),
    smoothing: numberSchema.optional(),
    enabled: booleanSchema.optional(),
  })
  .strict();

export const playerComponentSchema = z
  .object({
    speed: numberSchema.optional(),
    'jump-height': numberSchema.optional(),
    acceleration: numberSchema.optional(),
    'air-control': numberSchema.optional(),
    enabled: booleanSchema.optional(),
  })
  .strict();

export const entityRecipeSchema = z
  .object({
    transform: z.union([z.string(), transformComponentSchema]).optional(),
    body: z.union([z.string(), bodyComponentSchema]).optional(),
    collider: z.union([z.string(), colliderComponentSchema]).optional(),
    renderer: z.union([z.string(), rendererComponentSchema]).optional(),
    'orbit-camera': z
      .union([z.string(), orbitCameraComponentSchema])
      .optional(),
    player: z.union([z.string(), playerComponentSchema]).optional(),

    pos: vector3Schema.optional(),
    scale: vector3Schema.optional(),
    euler: vector3Schema.optional(),
    color: colorSchema.optional(),
    size: vector3Schema.optional(),
    shape: shapeSchema.optional(),

    id: z.string().optional(),
  })
  .passthrough();

export const staticPartRecipeSchema = z
  .object({
    pos: vector3Schema,
    shape: shapeSchema,
    size: vector3Schema,
    color: colorSchema,

    transform: z.union([z.string(), transformComponentSchema]).optional(),
    collider: z.union([z.string(), colliderComponentSchema]).optional(),
    renderer: z.union([z.string(), rendererComponentSchema]).optional(),

    scale: vector3Schema.optional(),
    euler: vector3Schema.optional(),
    restitution: numberSchema.optional(),
    friction: numberSchema.optional(),

    id: z.string().optional(),
  })
  .strict();

export const dynamicPartRecipeSchema = z
  .object({
    pos: vector3Schema,
    shape: shapeSchema,
    size: vector3Schema,
    color: colorSchema,

    transform: z.union([z.string(), transformComponentSchema]).optional(),
    body: z.union([z.string(), bodyComponentSchema]).optional(),
    collider: z.union([z.string(), colliderComponentSchema]).optional(),
    renderer: z.union([z.string(), rendererComponentSchema]).optional(),

    scale: vector3Schema.optional(),
    euler: vector3Schema.optional(),
    mass: numberSchema.optional(),
    restitution: numberSchema.optional(),
    friction: numberSchema.optional(),

    id: z.string().optional(),
  })
  .strict();

export const kinematicPartRecipeSchema = z
  .object({
    pos: vector3Schema,
    shape: shapeSchema,
    size: vector3Schema,
    color: colorSchema,

    transform: z.union([z.string(), transformComponentSchema]).optional(),
    body: z.union([z.string(), bodyComponentSchema]).optional(),
    collider: z.union([z.string(), colliderComponentSchema]).optional(),
    renderer: z.union([z.string(), rendererComponentSchema]).optional(),

    scale: vector3Schema.optional(),
    euler: vector3Schema.optional(),

    id: z.string().optional(),
  })
  .strict();

export const playerRecipeSchema = z
  .object({
    pos: vector3Schema.optional(),

    speed: numberSchema.optional(),
    'jump-height': numberSchema.optional(),
    acceleration: numberSchema.optional(),
    'air-control': numberSchema.optional(),

    transform: z.union([z.string(), transformComponentSchema]).optional(),
    body: z.union([z.string(), bodyComponentSchema]).optional(),
    collider: z.union([z.string(), colliderComponentSchema]).optional(),
    player: z.union([z.string(), playerComponentSchema]).optional(),

    id: z.string().optional(),
  })
  .strict();

export const cameraRecipeSchema = z
  .object({
    distance: numberSchema.optional(),
    'min-distance': numberSchema.optional(),
    'max-distance': numberSchema.optional(),
    'target-pitch': numberSchema.optional(),
    'target-yaw': numberSchema.optional(),

    transform: z.union([z.string(), transformComponentSchema]).optional(),
    'orbit-camera': z
      .union([z.string(), orbitCameraComponentSchema])
      .optional(),

    id: z.string().optional(),
  })
  .strict();

export const worldRecipeSchema = z
  .object({
    canvas: z.string().optional(),
    sky: colorSchema.optional(),
    fog: colorSchema.optional(),
    'fog-near': numberSchema.optional(),
    'fog-far': numberSchema.optional(),
    gravity: vector3Schema.optional(),

    id: z.string().optional(),
  })
  .strict();

export const easingSchema = z.enum([
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'sine-in',
  'sine-out',
  'sine-in-out',
  'quad-in',
  'quad-out',
  'quad-in-out',
  'cubic-in',
  'cubic-out',
  'cubic-in-out',
  'quart-in',
  'quart-out',
  'quart-in-out',
  'expo-in',
  'expo-out',
  'expo-in-out',
  'circ-in',
  'circ-out',
  'circ-in-out',
  'back-in',
  'back-out',
  'back-in-out',
  'elastic-in',
  'elastic-out',
  'elastic-in-out',
  'bounce-in',
  'bounce-out',
  'bounce-in-out',
]);

export const loopModeSchema = z.enum(['once', 'loop', 'ping-pong']);

export const tweenElementSchema = z
  .object({
    target: z.string().regex(/^[a-z-]+\.[a-z-]+(-[a-z]+)*$/),
    from: z.union([numberSchema, numberStringSchema, vector3Schema]).optional(),
    to: z.union([numberSchema, numberStringSchema, vector3Schema]),
    duration: z.union([numberSchema, numberStringSchema]).default(1),
    delay: z.union([numberSchema, numberStringSchema]).optional(),
    easing: easingSchema.optional(),
    loop: loopModeSchema.optional(),

    id: z.string().optional(),
  })
  .strict();

export const ambientLightRecipeSchema = z
  .object({
    'sky-color': colorSchema.optional(),
    'ground-color': colorSchema.optional(),
    intensity: z.union([numberSchema, numberStringSchema]).optional(),

    ambient: z.string().optional(),

    id: z.string().optional(),
  })
  .strict();

export const directionalLightRecipeSchema = z
  .object({
    color: colorSchema.optional(),
    intensity: z.union([numberSchema, numberStringSchema]).optional(),
    direction: vector3Schema.optional(),
    'cast-shadow': booleanSchema.optional(),
    'shadow-map-size': z.union([numberSchema, numberStringSchema]).optional(),
    distance: z.union([numberSchema, numberStringSchema]).optional(),

    directional: z.string().optional(),

    id: z.string().optional(),
  })
  .strict();

export const lightRecipeSchema = z
  .object({
    'sky-color': colorSchema.optional(),
    'ground-color': colorSchema.optional(),
    color: colorSchema.optional(),
    intensity: z.union([numberSchema, numberStringSchema]).optional(),
    direction: vector3Schema.optional(),
    'cast-shadow': booleanSchema.optional(),

    ambient: z.string().optional(),
    directional: z.string().optional(),

    id: z.string().optional(),
  })
  .strict();

export const recipeSchemas = {
  entity: entityRecipeSchema,
  'static-part': staticPartRecipeSchema,
  'dynamic-part': dynamicPartRecipeSchema,
  'kinematic-part': kinematicPartRecipeSchema,
  player: playerRecipeSchema,
  camera: cameraRecipeSchema,
  world: worldRecipeSchema,
  tween: tweenElementSchema,
  'ambient-light': ambientLightRecipeSchema,
  'directional-light': directionalLightRecipeSchema,
  light: lightRecipeSchema,
} as const;

export type RecipeSchemas = typeof recipeSchemas;
export type RecipeName = keyof RecipeSchemas;
export type RecipeAttributes<T extends RecipeName> = z.infer<RecipeSchemas[T]>;
