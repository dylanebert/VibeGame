import type { Plugin } from '../';
import { Parent } from './components';
import { entityRecipe } from './recipes';

export const RecipePlugin: Plugin = {
  components: {
    parent: Parent,
  },
  recipes: [entityRecipe],
};
