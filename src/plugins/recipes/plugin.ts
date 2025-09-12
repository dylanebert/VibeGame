import type { Plugin } from '../../core';
import { Parent } from './components';
import { entityRecipe } from './recipes';

export const RecipePlugin: Plugin = {
  components: {
    parent: Parent,
  },
  recipes: [entityRecipe],
};
