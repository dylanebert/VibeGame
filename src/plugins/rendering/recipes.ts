import type { Recipe } from '../../core';

export const ambientLightRecipe: Recipe = {
  name: 'ambient-light',
  components: ['ambient'],
};

export const directionalLightRecipe: Recipe = {
  name: 'directional-light',
  components: ['directional'],
};

export const lightRecipe: Recipe = {
  name: 'light',
  components: ['ambient', 'directional'],
};
