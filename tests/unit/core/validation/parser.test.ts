import { describe, expect, it } from 'bun:test';
import {
  validateRecipeAttributes,
  safeValidateRecipeAttributes,
  isValidRecipeName,
  getAvailableRecipeNames,
  getRecipeSchema,
} from 'vibegame/core/validation';

describe('Validation Parser', () => {
  describe('validateRecipeAttributes', () => {
    it('should validate and parse static-part attributes', () => {
      const attributes = {
        pos: '0 5 0',
        shape: 'box',
        size: '2 2 2',
        color: '#ff0000',
      };

      const result = validateRecipeAttributes('static-part', attributes);
      expect(result.pos).toEqual({ x: 0, y: 5, z: 0 });
      expect(result.shape).toBe('box');
      expect(result.size).toEqual({ x: 2, y: 2, z: 2 });
      expect(result.color).toBe(16711680);
    });

    it('should throw on invalid attributes', () => {
      const attributes = {
        pos: '0 5 0',
        shape: 'invalid-shape',
        size: '1 1 1',
        color: '#ff0000',
      };

      expect(() =>
        validateRecipeAttributes('static-part', attributes)
      ).toThrow();
    });

    it('should throw on missing required attributes', () => {
      const attributes = {
        shape: 'box',
        size: '1 1 1',
        color: '#ff0000',
      };

      expect(() =>
        validateRecipeAttributes('static-part', attributes)
      ).toThrow();
    });

    it('should throw for unknown recipe', () => {
      expect(() =>
        validateRecipeAttributes('unknown-recipe' as any, {})
      ).toThrow('Unknown recipe');
    });

    it('should validate entity recipe with optional attributes', () => {
      const attributes = {
        pos: '1 2 3',
        scale: '2',
        euler: '0 45 0',
      };

      const result = validateRecipeAttributes('entity', attributes);
      expect(result.pos).toEqual({ x: 1, y: 2, z: 3 });
      expect(result.scale).toEqual({ x: 2, y: 2, z: 2 });
      expect(result.euler).toEqual({ x: 0, y: 45, z: 0 });
    });

    it('should validate player recipe attributes', () => {
      const attributes = {
        speed: 10,
        'jump-height': 5,
      };

      const result = validateRecipeAttributes('player', attributes);
      expect(result.speed).toBe(10);
      expect(result['jump-height']).toBe(5);
    });

    it('should validate world recipe attributes', () => {
      const attributes = {
        canvas: '#game-canvas',
        sky: '#87ceeb',
        'fog-near': 10,
        'fog-far': 100,
      };

      const result = validateRecipeAttributes('world', attributes);
      expect(result.canvas).toBe('#game-canvas');
      expect(result.sky).toBe(8900331);
      expect(result['fog-near']).toBe(10);
      expect(result['fog-far']).toBe(100);
    });
  });

  describe('safeValidateRecipeAttributes', () => {
    it('should return success result for valid attributes', () => {
      const attributes = {
        pos: '0 0 0',
        shape: 'sphere',
        size: '1',
        color: '0x00ff00',
      };

      const result = safeValidateRecipeAttributes('static-part', attributes);
      expect(result.success).toBe(true);
      expect(result.data?.pos).toEqual({ x: 0, y: 0, z: 0 });
      expect(result.data?.shape).toBe('sphere');
      expect(result.error).toBeUndefined();
    });

    it('should return error result for invalid attributes', () => {
      const attributes = {
        pos: 'invalid',
        shape: 'box',
        size: '1 1 1',
        color: '#ff0000',
      };

      const result = safeValidateRecipeAttributes('static-part', attributes);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it('should include validation options in error', () => {
      const attributes = {
        pos: 'invalid-position',
      };

      const result = safeValidateRecipeAttributes('entity', attributes, {
        filename: 'test.xml',
        lineNumber: 10,
      });

      expect(result.success).toBe(false);
      if (result.error) {
        expect(result.error).toContain('test.xml:10');
      }
    });
  });

  describe('isValidRecipeName', () => {
    it('should return true for valid recipe names', () => {
      expect(isValidRecipeName('entity')).toBe(true);
      expect(isValidRecipeName('static-part')).toBe(true);
      expect(isValidRecipeName('dynamic-part')).toBe(true);
      expect(isValidRecipeName('kinematic-part')).toBe(true);
      expect(isValidRecipeName('player')).toBe(true);
      expect(isValidRecipeName('camera')).toBe(true);
      expect(isValidRecipeName('world')).toBe(true);
    });

    it('should return false for invalid recipe names', () => {
      expect(isValidRecipeName('unknown')).toBe(false);
      expect(isValidRecipeName('custom-recipe')).toBe(false);
      expect(isValidRecipeName('')).toBe(false);
    });
  });

  describe('getAvailableRecipeNames', () => {
    it('should return all recipe names', () => {
      const names = getAvailableRecipeNames();
      expect(names).toContain('entity');
      expect(names).toContain('static-part');
      expect(names).toContain('dynamic-part');
      expect(names).toContain('kinematic-part');
      expect(names).toContain('player');
      expect(names).toContain('camera');
      expect(names).toContain('world');
      expect(names).toContain('tween');
      expect(names.length).toBe(8);
    });
  });

  describe('getRecipeSchema', () => {
    it('should return schema for valid recipe', () => {
      const schema = getRecipeSchema('static-part');
      expect(schema).toBeDefined();

      if (schema) {
        const result = schema.safeParse({
          pos: '0 0 0',
          shape: 'box',
          size: '1 1 1',
          color: '#ffffff',
        });
        expect(result.success).toBe(true);
      }
    });

    it('should return undefined for unknown recipe', () => {
      const schema = getRecipeSchema('unknown' as any);
      expect(schema).toBeUndefined();
    });

    it('should validate with returned schema', () => {
      const schema = getRecipeSchema('player');
      expect(schema).toBeDefined();

      if (schema) {
        const result = schema.safeParse({
          speed: 8,
          'jump-height': 3,
        });
        expect(result.success).toBe(true);
      }
    });
  });
});
