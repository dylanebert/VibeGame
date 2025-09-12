import type { Recipe } from '../../core';
import { AMBIENT_DEFAULTS, DIRECTIONAL_DEFAULTS } from './constants';

export const ambientLightRecipe: Recipe = {
  name: 'ambient-light',
  components: ['ambient'],
  overrides: {
    'ambient.sky-color': AMBIENT_DEFAULTS.skyColor,
    'ambient.ground-color': AMBIENT_DEFAULTS.groundColor,
    'ambient.intensity': AMBIENT_DEFAULTS.intensity,
  },
};

export const directionalLightRecipe: Recipe = {
  name: 'directional-light',
  components: ['directional'],
  overrides: {
    'directional.color': DIRECTIONAL_DEFAULTS.color,
    'directional.intensity': DIRECTIONAL_DEFAULTS.intensity,
    'directional.cast-shadow': DIRECTIONAL_DEFAULTS.castShadow,
    'directional.shadow-map-size': DIRECTIONAL_DEFAULTS.shadowMapSize,
    'directional.direction-x': DIRECTIONAL_DEFAULTS.directionX,
    'directional.direction-y': DIRECTIONAL_DEFAULTS.directionY,
    'directional.direction-z': DIRECTIONAL_DEFAULTS.directionZ,
    'directional.distance': DIRECTIONAL_DEFAULTS.distance,
  },
};

export const lightRecipe: Recipe = {
  name: 'light',
  components: ['ambient', 'directional'],
  overrides: {
    'ambient.sky-color': AMBIENT_DEFAULTS.skyColor,
    'ambient.ground-color': AMBIENT_DEFAULTS.groundColor,
    'ambient.intensity': AMBIENT_DEFAULTS.intensity,
    'directional.color': DIRECTIONAL_DEFAULTS.color,
    'directional.intensity': DIRECTIONAL_DEFAULTS.intensity,
    'directional.cast-shadow': DIRECTIONAL_DEFAULTS.castShadow,
    'directional.shadow-map-size': DIRECTIONAL_DEFAULTS.shadowMapSize,
    'directional.direction-x': DIRECTIONAL_DEFAULTS.directionX,
    'directional.direction-y': DIRECTIONAL_DEFAULTS.directionY,
    'directional.direction-z': DIRECTIONAL_DEFAULTS.directionZ,
    'directional.distance': DIRECTIONAL_DEFAULTS.distance,
  },
};
