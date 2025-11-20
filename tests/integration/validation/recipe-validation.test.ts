import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import {
  validateRecipeAttributes,
  validateXMLContent,
} from 'vibegame/core/validation';

describe('Recipe Validation Integration', () => {
  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;
  });

  describe('static-part validation', () => {
    it('should validate all required and optional fields', () => {
      const attributes = {
        pos: '0 -0.5 0',
        shape: 'box',
        size: '20 1 20',
        color: '#90ee90',
        scale: '1.5',
        euler: '0 45 0',
        restitution: 0.8,
        friction: 0.3,
        id: 'ground',
      };

      const result = validateRecipeAttributes('static-part', attributes);
      expect(result.pos).toEqual({ x: 0, y: -0.5, z: 0 });
      expect(result.shape).toBe('box');
      expect(result.size).toEqual({ x: 20, y: 1, z: 20 });
      expect(result.color).toBe(9498256);
      expect(result.scale).toEqual({ x: 1.5, y: 1.5, z: 1.5 });
      expect(result.euler).toEqual({ x: 0, y: 45, z: 0 });
      expect(result.restitution).toBe(0.8);
      expect(result.friction).toBe(0.3);
      expect(result.id).toBe('ground');
    });

    it('should validate with component overrides', () => {
      const attributes = {
        pos: '0 0 0',
        shape: 'sphere',
        size: '2',
        color: '0xff0000',
        transform: 'pos: 0 5 0; scale: 3',
        collider: 'shape: box; friction: 0.5',
      };

      const result = validateRecipeAttributes('static-part', attributes);
      expect(result.transform).toBe('pos: 0 5 0; scale: 3');
      expect(result.collider).toBe('shape: box; friction: 0.5');
    });

    it('should reject invalid shape values', () => {
      const attributes = {
        pos: '0 0 0',
        shape: 'triangle',
        size: '1 1 1',
        color: '#ffffff',
      };

      expect(() =>
        validateRecipeAttributes('static-part', attributes)
      ).toThrow();
    });
  });

  describe('dynamic-part validation', () => {
    it('should validate physics-specific properties', () => {
      const attributes = {
        pos: '0 5 0',
        shape: 'sphere',
        size: '1',
        color: '#ff0000',
        mass: 5,
        restitution: 0.9,
        friction: 0.1,
      };

      const result = validateRecipeAttributes('dynamic-part', attributes);
      expect(result.mass).toBe(5);
      expect(result.restitution).toBe(0.9);
      expect(result.friction).toBe(0.1);
    });

    it('should validate body component override', () => {
      const attributes = {
        pos: '0 0 0',
        shape: 'sphere',
        size: '1',
        color: '#00ff00',
        body: 'type: dynamic; mass: 10; linear-damping: 0.5',
      };

      const result = validateRecipeAttributes('dynamic-part', attributes);
      expect(result.body).toBe('type: dynamic; mass: 10; linear-damping: 0.5');
    });
  });

  describe('kinematic-part validation', () => {
    it('should validate kinematic-specific configuration', () => {
      const attributes = {
        pos: '5 2 0',
        shape: 'box',
        size: '3 0.5 3',
        color: '#0000ff',
        euler: '0 0 0',
      };

      const result = validateRecipeAttributes('kinematic-part', attributes);
      expect(result.pos).toEqual({ x: 5, y: 2, z: 0 });
      expect(result.euler).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should not allow mass for kinematic bodies', () => {
      const attributes = {
        pos: '0 0 0',
        shape: 'box',
        size: '1 1 1',
        color: '#ffffff',
        mass: 10,
      };

      expect(() =>
        validateRecipeAttributes('kinematic-part', attributes)
      ).toThrow();
    });
  });

  describe('player validation', () => {
    it('should validate player properties', () => {
      const attributes = {
        pos: '0 1 0',
        speed: 8,
        'jump-height': 3,
        acceleration: 5,
        'air-control': 0.3,
      };

      const result = validateRecipeAttributes('player', attributes);
      expect(result.pos).toEqual({ x: 0, y: 1, z: 0 });
      expect(result.speed).toBe(8);
      expect(result['jump-height']).toBe(3);
      expect(result.acceleration).toBe(5);
      expect(result['air-control']).toBe(0.3);
    });

    it('should validate component overrides', () => {
      const attributes = {
        transform: 'pos: 10 0 10',
        body: 'type: dynamic; mass: 80',
        player: 'speed: 12; jump-height: 5',
      };

      const result = validateRecipeAttributes('player', attributes);
      expect(result.transform).toBe('pos: 10 0 10');
      expect(result.body).toBe('type: dynamic; mass: 80');
      expect(result.player).toBe('speed: 12; jump-height: 5');
    });
  });

  describe('camera validation', () => {
    it('should validate camera properties', () => {
      const attributes = {
        distance: 10,
        'min-distance': 5,
        'max-distance': 20,
        'target-pitch': 0.5,
        'target-yaw': 1.57,
      };

      const result = validateRecipeAttributes('camera', attributes);
      expect(result.distance).toBe(10);
      expect(result['min-distance']).toBe(5);
      expect(result['max-distance']).toBe(20);
      expect(result['target-pitch']).toBe(0.5);
      expect(result['target-yaw']).toBe(1.57);
    });

    it('should validate orbit-camera component override', () => {
      const attributes = {
        'orbit-camera': 'distance: 15; sensitivity: 0.005',
      };

      const result = validateRecipeAttributes('camera', attributes);
      expect(result['orbit-camera']).toBe('distance: 15; sensitivity: 0.005');
    });
  });

  describe('world validation', () => {
    it('should validate world configuration', () => {
      const attributes = {
        canvas: '#game-canvas',
        sky: '#87ceeb',
        fog: '#cccccc',
        'fog-near': 10,
        'fog-far': 100,
        gravity: '0 -9.81 0',
      };

      const result = validateRecipeAttributes('world', attributes);
      expect(result.canvas).toBe('#game-canvas');
      expect(result.sky).toBe(8900331);
      expect(result.fog).toBe(13421772);
      expect(result['fog-near']).toBe(10);
      expect(result['fog-far']).toBe(100);
      expect(result.gravity).toEqual({ x: 0, y: -9.81, z: 0 });
    });

    it('should accept minimal world configuration', () => {
      const attributes = {
        canvas: '#game',
      };

      const result = validateRecipeAttributes('world', attributes);
      expect(result.canvas).toBe('#game');
    });
  });

  describe('entity validation', () => {
    it('should validate with passthrough for custom components', () => {
      const attributes = {
        pos: '0 0 0',
        customAttribute: 'customValue',
        anotherCustom: 123,
      };

      const result = validateRecipeAttributes('entity', attributes);
      expect(result.pos).toEqual({ x: 0, y: 0, z: 0 });
      expect(result.customAttribute).toBe('customValue');
      expect(result.anotherCustom).toBe(123);
    });

    it('should validate component string syntax', () => {
      const attributes = {
        transform: 'pos: 1 2 3; scale: 2',
        renderer: 'shape: box; color: 0xff0000',
      };

      const result = validateRecipeAttributes('entity', attributes);
      expect(result.transform).toBe('pos: 1 2 3; scale: 2');
      expect(result.renderer).toBe('shape: box; color: 0xff0000');
    });
  });

  describe('tween validation', () => {
    it('should validate tween element attributes', () => {
      const attributes = {
        target: 'platform',
        attr: 'body.pos-x',
        from: '-5',
        to: '5',
        duration: '3',
        easing: 'ease-in-out',
      };

      const result = validateRecipeAttributes('tween', attributes);
      expect(result.target).toBe('platform');
      expect(result.attr).toBe('body.pos-x');
      expect(result.from).toBe(-5);
      expect(result.to).toBe(5);
      expect(result.duration).toBe(3);
      expect(result.easing).toBe('ease-in-out');
    });

    it('should validate tween with vector3 values', () => {
      const attributes = {
        target: 'cube',
        attr: 'transform.pos',
        from: '0 0 0',
        to: '10 5 -3',
        duration: 2,
      };

      const result = validateRecipeAttributes('tween', attributes);
      expect(result.from).toEqual({ x: 0, y: 0, z: 0 });
      expect(result.to).toEqual({ x: 10, y: 5, z: -3 });
    });

    it('should reject missing target', () => {
      const attributes = {
        attr: 'body.pos-x',
        to: '5',
      };

      expect(() => validateRecipeAttributes('tween', attributes)).toThrow();
    });

    it('should reject invalid easing value', () => {
      const attributes = {
        target: 'cube',
        attr: 'body.pos-y',
        to: '5',
        easing: 'invalid-easing',
      };

      expect(() => validateRecipeAttributes('tween', attributes)).toThrow();
    });
  });

  describe('hierarchical validation', () => {
    it('should allow tween as sibling of entity types', () => {
      const xml = `
        <entity>
          <static-part name="platform" pos="0 3 0" shape="box" size="3 0.5 3" color="#0000ff"></static-part>
          <tween target="platform" attr="body.pos-x" from="-5" to="5" duration="3"></tween>
        </entity>
      `;

      const result = validateXMLContent(xml);
      if (!result.success) console.error('Validation error:', result.error);
      expect(result.success).toBe(true);
    });

    it('should allow tween in world with target', () => {
      const xml = `
        <world canvas="#game">
          <entity name="cube" transform=""></entity>
          <tween target="cube" attr="transform.pos-x" to="5"></tween>
        </world>
      `;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(true);
    });

    it('should allow nested entities', () => {
      const xml = `
        <entity>
          <entity transform="pos: 2 0 0">
            <entity transform="pos: 0 2 0"></entity>
          </entity>
        </entity>
      `;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(true);
    });

    it('should allow lighting in world', () => {
      const xml = `
        <world canvas="#game">
          <entity ambient-light="sky-color: 0x87ceeb" directional-light="color: 0xffffff"></entity>
        </world>
      `;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(true);
    });

    it('should reject world as child of entity', () => {
      const xml = `
        <entity>
          <world canvas="#game"></world>
        </entity>
      `;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not allowed as a child of <entity>');
    });

    it('should allow multiple tweens targeting same entity', () => {
      const xml = `
        <entity>
          <kinematic-part name="platform" pos="0 3 0" shape="box" size="3 0.5 3" color="#0000ff"></kinematic-part>
          <tween target="platform" attr="body.pos-x" from="-5" to="5" duration="3"></tween>
          <tween target="platform" attr="body.euler-y" from="0" to="360" duration="2"></tween>
        </entity>
      `;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(true);
    });
  });

  describe('Real-world XML examples', () => {
    it('should validate complete game world with lighting', () => {
      const xml = `
        <world canvas="#game-canvas" sky="#87ceeb">
          <entity ambient-light="sky-color: 0x87ceeb; intensity: 0.6" directional-light="color: 0xffffff; intensity: 1; direction-x: -1; direction-y: -2; direction-z: -1"></entity>
          <static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#90ee90"></static-part>
          <dynamic-part pos="-2 4 -3" shape="sphere" size="1" color="#ff4500"></dynamic-part>
          <kinematic-part name="platform" pos="5 2 0" shape="box" size="3 0.5 3" color="#0000ff"></kinematic-part>
          <tween target="platform" attr="body.pos-y" from="2" to="5" duration="3"></tween>
          <player pos="0 1 0" speed="8"></player>
          <camera distance="10"></camera>
        </world>
      `;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(true);
    });

    it('should validate platformer with animated elements', () => {
      const xml = `
        <entity>
          <static-part pos="-5 2 0" shape="box" size="3 0.5 3" color="#808080"></static-part>
          <static-part pos="0 4 0" shape="box" size="3 0.5 3" color="#808080"></static-part>
          <static-part pos="5 6 0" shape="box" size="3 0.5 3" color="#808080"></static-part>
          <kinematic-part name="moving-platform" pos="0 3 5" shape="box" size="4 0.5 4" color="#4169e1"></kinematic-part>
          <tween target="moving-platform" attr="body.pos-x" from="-10" to="10" duration="5"></tween>
          <kinematic-part name="spinner" pos="2 1 0" shape="box" size="0.5 0.1 0.5" color="#ffd700"></kinematic-part>
          <tween target="spinner" attr="body.euler-y" from="0" to="360" duration="2"></tween>
        </entity>
      `;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(true);
    });
  });
});
