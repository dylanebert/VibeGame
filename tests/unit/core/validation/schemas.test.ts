import { describe, expect, it } from 'bun:test';
import {
  vector3Schema,
  vector2Schema,
  colorSchema,
  shapeSchema,
  bodyTypeSchema,
  transformComponentSchema,
  bodyComponentSchema,
  colliderComponentSchema,
  staticPartRecipeSchema,
  dynamicPartRecipeSchema,
  playerRecipeSchema,
} from 'vibegame/core/validation';

describe('Validation Schemas', () => {
  describe('vector3Schema', () => {
    it('should parse single number and broadcast to all axes', () => {
      const result = vector3Schema.parse(5);
      expect(result).toEqual({ x: 5, y: 5, z: 5 });
    });

    it('should parse string number and broadcast', () => {
      const result = vector3Schema.parse('3.14');
      expect(result).toEqual({ x: 3.14, y: 3.14, z: 3.14 });
    });

    it('should parse "x y z" format', () => {
      const result = vector3Schema.parse('1 2 3');
      expect(result).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('should parse negative values', () => {
      const result = vector3Schema.parse('-1.5 0 2.5');
      expect(result).toEqual({ x: -1.5, y: 0, z: 2.5 });
    });

    it('should reject invalid formats', () => {
      expect(() => vector3Schema.parse('1 2')).toThrow();
      expect(() => vector3Schema.parse('a b c')).toThrow();
      expect(() => vector3Schema.parse('1 2 3 4')).toThrow();
    });
  });

  describe('vector2Schema', () => {
    it('should parse single number and broadcast', () => {
      const result = vector2Schema.parse(10);
      expect(result).toEqual({ x: 10, y: 10 });
    });

    it('should parse "x y" format', () => {
      const result = vector2Schema.parse('5 7');
      expect(result).toEqual({ x: 5, y: 7 });
    });

    it('should reject invalid formats', () => {
      expect(() => vector2Schema.parse('1 2 3')).toThrow();
      expect(() => vector2Schema.parse('not numbers')).toThrow();
    });
  });

  describe('colorSchema', () => {
    it('should parse hex color with # prefix', () => {
      const result = colorSchema.parse('#ff0000');
      expect(result).toBe(16711680);
    });

    it('should parse hex color with 0x prefix', () => {
      const result = colorSchema.parse('0xff0000');
      expect(result).toBe(16711680);
    });

    it('should parse numeric color value', () => {
      const result = colorSchema.parse(16711680);
      expect(result).toBe(16711680);
    });

    it('should parse string number', () => {
      const result = colorSchema.parse('16711680');
      expect(result).toBe(16711680);
    });

    it('should reject invalid hex formats', () => {
      expect(() => colorSchema.parse('#ff00')).toThrow();
      expect(() => colorSchema.parse('#gggggg')).toThrow();
      expect(() => colorSchema.parse('0xgggggg')).toThrow();
    });
  });

  describe('shapeSchema', () => {
    it('should accept valid shape values', () => {
      expect(shapeSchema.parse('box')).toBe('box');
      expect(shapeSchema.parse('sphere')).toBe('sphere');
      expect(shapeSchema.parse('cylinder')).toBe('cylinder');
      expect(shapeSchema.parse('capsule')).toBe('capsule');
      expect(shapeSchema.parse('cone')).toBe('cone');
      expect(shapeSchema.parse('torus')).toBe('torus');
      expect(shapeSchema.parse('plane')).toBe('plane');
    });

    it('should reject invalid shape values', () => {
      expect(() => shapeSchema.parse('invalid-shape')).toThrow();
      expect(() => shapeSchema.parse('triangle')).toThrow();
      expect(() => shapeSchema.parse('')).toThrow();
    });
  });

  describe('bodyTypeSchema', () => {
    it('should accept valid body types', () => {
      expect(bodyTypeSchema.parse('static')).toBe('static');
      expect(bodyTypeSchema.parse('dynamic')).toBe('dynamic');
      expect(bodyTypeSchema.parse('kinematic')).toBe('kinematic');
    });

    it('should reject invalid body types', () => {
      expect(() => bodyTypeSchema.parse('fixed')).toThrow();
      expect(() => bodyTypeSchema.parse('rigid')).toThrow();
    });
  });

  describe('transformComponentSchema', () => {
    it('should accept valid transform properties', () => {
      const result = transformComponentSchema.parse({
        pos: '0 1 0',
        scale: 2,
        euler: '0 45 0',
      });
      expect(result.pos).toEqual({ x: 0, y: 1, z: 0 });
      expect(result.scale).toEqual({ x: 2, y: 2, z: 2 });
      expect(result.euler).toEqual({ x: 0, y: 45, z: 0 });
    });

    it('should reject unknown properties in strict mode', () => {
      expect(() =>
        transformComponentSchema.parse({
          pos: '0 0 0',
          unknownProp: 'value',
        })
      ).toThrow();
    });

    it('should reject rot property as deprecated', () => {
      expect(() =>
        transformComponentSchema.parse({
          rot: '0 0 0 1',
        })
      ).toThrow();
    });
  });

  describe('bodyComponentSchema', () => {
    it('should accept valid body properties', () => {
      const result = bodyComponentSchema.parse({
        type: 'dynamic',
        pos: '0 5 0',
        mass: 10,
        'linear-damping': 0.5,
      });
      expect(result.type).toBe('dynamic');
      expect(result.pos).toEqual({ x: 0, y: 5, z: 0 });
      expect(result.mass).toBe(10);
      expect(result['linear-damping']).toBe(0.5);
    });
  });

  describe('colliderComponentSchema', () => {
    it('should accept valid collider properties', () => {
      const result = colliderComponentSchema.parse({
        shape: 'box',
        size: '1 1 1',
        restitution: 0.8,
        friction: 0.3,
        sensor: false,
      });
      expect(result.shape).toBe('box');
      expect(result.size).toEqual({ x: 1, y: 1, z: 1 });
      expect(result.restitution).toBe(0.8);
      expect(result.sensor).toBe(false);
    });
  });

  describe('staticPartRecipeSchema', () => {
    it('should require all mandatory fields', () => {
      const result = staticPartRecipeSchema.parse({
        pos: '0 0 0',
        shape: 'box',
        size: '1 1 1',
        color: '#ff0000',
      });
      expect(result.pos).toEqual({ x: 0, y: 0, z: 0 });
      expect(result.shape).toBe('box');
      expect(result.size).toEqual({ x: 1, y: 1, z: 1 });
      expect(result.color).toBe(16711680);
    });

    it('should accept optional fields', () => {
      const result = staticPartRecipeSchema.parse({
        pos: '0 0 0',
        shape: 'sphere',
        size: '2',
        color: '#00ff00',
        scale: '1.5',
        restitution: 0.9,
        id: 'my-static-part',
      });
      expect(result.scale).toEqual({ x: 1.5, y: 1.5, z: 1.5 });
      expect(result.restitution).toBe(0.9);
      expect(result.id).toBe('my-static-part');
    });

    it('should reject missing required fields', () => {
      expect(() =>
        staticPartRecipeSchema.parse({
          shape: 'box',
          size: '1 1 1',
          color: '#ff0000',
        })
      ).toThrow();
    });

    it('should reject unknown fields in strict mode', () => {
      expect(() =>
        staticPartRecipeSchema.parse({
          pos: '0 0 0',
          shape: 'box',
          size: '1 1 1',
          color: '#ff0000',
          unknownField: 'value',
        })
      ).toThrow();
    });
  });

  describe('dynamicPartRecipeSchema', () => {
    it('should accept body-specific properties', () => {
      const result = dynamicPartRecipeSchema.parse({
        pos: '0 5 0',
        shape: 'sphere',
        size: '1',
        color: '#0000ff',
        mass: 5,
      });
      expect(result.mass).toBe(5);
    });

    it('should accept body component override', () => {
      const result = dynamicPartRecipeSchema.parse({
        pos: '0 0 0',
        shape: 'box',
        size: '1 1 1',
        color: '#ffffff',
        body: 'type: dynamic; mass: 10',
      });
      expect(result.body).toBe('type: dynamic; mass: 10');
    });
  });

  describe('playerRecipeSchema', () => {
    it('should accept player-specific properties', () => {
      const result = playerRecipeSchema.parse({
        speed: 8,
        'jump-height': 3,
        acceleration: 5,
      });
      expect(result.speed).toBe(8);
      expect(result['jump-height']).toBe(3);
      expect(result.acceleration).toBe(5);
    });

    it('should accept optional position override', () => {
      const result = playerRecipeSchema.parse({
        pos: '10 0 10',
        speed: 10,
      });
      expect(result.pos).toEqual({ x: 10, y: 0, z: 10 });
    });
  });
});
