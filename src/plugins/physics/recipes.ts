import type { Recipe } from '../../core';
import { BodyType } from './components';

const physicsPartRecipe: Recipe = {
  name: 'physics-part',
  components: ['body', 'collider', 'transform', 'renderer'],
};

export const staticPartRecipe: Recipe = {
  ...physicsPartRecipe,
  name: 'static-part',
  overrides: {
    'body.type': BodyType.Fixed,
    'body.mass': 0,
    'body.gravity-scale': 0,
  },
};

export const dynamicPartRecipe: Recipe = {
  ...physicsPartRecipe,
  name: 'dynamic-part',
  overrides: {
    'body.type': BodyType.Dynamic,
  },
};

export const kinematicPartRecipe: Recipe = {
  ...physicsPartRecipe,
  name: 'kinematic-part',
  overrides: {
    'body.type': BodyType.KinematicVelocityBased,
    'body.gravity-scale': 0,
  },
};
