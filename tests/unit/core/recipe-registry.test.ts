import { beforeEach, describe, expect, it } from 'bun:test';
import type { Recipe } from 'vibegame';
import { RecipeRegistry } from 'vibegame';

describe('RecipeRegistry', () => {
  let registry: RecipeRegistry;

  beforeEach(() => {
    registry = new RecipeRegistry();
  });

  const basicRecipe: Recipe = {
    name: 'entity',
    components: [],
  };

  const playerRecipe: Recipe = {
    name: 'player',
    components: ['transform', 'renderer'],
    overrides: { 'transform.posY': 1 },
  };

  const enemyRecipe: Recipe = {
    name: 'enemy',
    components: ['transform', 'renderer', 'ai'],
  };

  describe('registration', () => {
    it('should register recipe', () => {
      registry.register(playerRecipe);

      expect(registry.get('player')).toBe(playerRecipe);
    });

    it('should allow overwriting recipe with same name', () => {
      const v1: Recipe = { name: 'box', components: ['transform'] };
      const v2: Recipe = { name: 'box', components: ['transform', 'renderer'] };

      registry.register(v1);
      registry.register(v2);

      expect(registry.get('box')).toBe(v2);
    });

    it('should register multiple recipes', () => {
      registry.register(playerRecipe);
      registry.register(enemyRecipe);
      registry.register(basicRecipe);

      expect(registry.get('player')).toBe(playerRecipe);
      expect(registry.get('enemy')).toBe(enemyRecipe);
      expect(registry.get('entity')).toBe(basicRecipe);
    });
  });

  describe('lookup', () => {
    it('should retrieve registered recipe', () => {
      registry.register(playerRecipe);

      const retrieved = registry.get('player');
      expect(retrieved).toBe(playerRecipe);
      expect(retrieved?.components).toContain('transform');
      expect(retrieved?.components).toContain('renderer');
    });

    it('should return undefined for unknown recipe', () => {
      expect(registry.get('unknown')).toBeUndefined();
    });

    it('should preserve recipe data', () => {
      registry.register(playerRecipe);

      const retrieved = registry.get('player');
      expect(retrieved?.name).toBe('player');
      expect(retrieved?.overrides).toEqual({ 'transform.posY': 1 });
    });
  });

  describe('existence check', () => {
    it('should return true for registered recipe', () => {
      registry.register(basicRecipe);

      expect(registry.has('entity')).toBe(true);
    });

    it('should return false for unknown recipe', () => {
      expect(registry.has('unknown')).toBe(false);
    });

    it('should return true after overwrite', () => {
      const v1: Recipe = { name: 'test', components: [] };
      const v2: Recipe = { name: 'test', components: ['x'] };

      registry.register(v1);
      registry.register(v2);

      expect(registry.has('test')).toBe(true);
      expect(registry.get('test')).toBe(v2);
    });
  });

  describe('iteration', () => {
    it('should return set of all recipe names', () => {
      registry.register(basicRecipe);
      registry.register(playerRecipe);
      registry.register(enemyRecipe);

      const names = registry.getNames();
      expect(names.has('entity')).toBe(true);
      expect(names.has('player')).toBe(true);
      expect(names.has('enemy')).toBe(true);
      expect(names.size).toBe(3);
    });

    it('should return empty set when no recipes registered', () => {
      const names = registry.getNames();
      expect(names.size).toBe(0);
    });

    it('should return copy of internal set (immutability)', () => {
      registry.register(basicRecipe);

      const names = registry.getNames();
      names.add('hacker');

      expect(registry.has('hacker')).toBe(false);
    });

    it('should not include duplicate names after overwrite', () => {
      const v1: Recipe = { name: 'test', components: [] };
      const v2: Recipe = { name: 'test', components: ['x'] };

      registry.register(v1);
      registry.register(v2);

      const names = registry.getNames();
      const testCount = Array.from(names).filter((n) => n === 'test').length;
      expect(testCount).toBe(1);
    });
  });
});
