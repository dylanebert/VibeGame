import type { Recipe } from './types';

export class RecipeRegistry {
  private readonly recipes = new Map<string, Recipe>();

  register(recipe: Recipe): void {
    this.recipes.set(recipe.name, recipe);
  }

  get(name: string): Recipe | undefined {
    return this.recipes.get(name);
  }

  has(name: string): boolean {
    return this.recipes.has(name);
  }

  getNames(): Set<string> {
    return new Set(this.recipes.keys());
  }
}
