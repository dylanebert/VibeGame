import { defineComponent, Types } from 'bitecs';
import { beforeEach, describe, expect, it } from 'bun:test';
import { State } from 'vibegame';
import { createEntityFromRecipe, fromEuler, RecipePlugin } from 'vibegame';

describe('Recipe Plugin', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(RecipePlugin);
  });

  it('should register recipe plugin', () => {
    expect(state.hasRecipe('entity')).toBe(true);
  });

  it('should create entity from recipe', () => {
    const TestComponent = defineComponent({
      value: Types.f32,
    });

    state.registerComponent('test', TestComponent);

    const recipe = {
      name: 'test-recipe',
      components: ['test'],
      overrides: {
        'test.value': 42,
      },
    };

    state.registerRecipe(recipe);

    const entity = createEntityFromRecipe(state, 'test-recipe');
    expect(entity).toBeGreaterThanOrEqual(0);
    expect(state.hasComponent(entity, TestComponent)).toBe(true);
    expect(TestComponent.value[entity]).toBe(42);
  });

  it('should create entity with multiple components', () => {
    const Position = defineComponent({
      x: Types.f32,
      y: Types.f32,
    });

    const Velocity = defineComponent({
      dx: Types.f32,
      dy: Types.f32,
    });

    state.registerComponent('position', Position);
    state.registerComponent('velocity', Velocity);

    const recipe = {
      name: 'moving-thing',
      components: ['position', 'velocity'],
      overrides: {
        'position.x': 10,
        'position.y': 20,
        'velocity.dx': 1,
        'velocity.dy': 2,
      },
    };

    state.registerRecipe(recipe);

    const entity = createEntityFromRecipe(state, 'moving-thing');

    expect(state.hasComponent(entity, Position)).toBe(true);
    expect(state.hasComponent(entity, Velocity)).toBe(true);
    expect(Position.x[entity]).toBe(10);
    expect(Position.y[entity]).toBe(20);
    expect(Velocity.dx[entity]).toBe(1);
    expect(Velocity.dy[entity]).toBe(2);
  });

  describe('Recipe Shorthands', () => {
    it('should expand shorthands to component properties', () => {
      const Renderer = defineComponent({
        shape: Types.ui8,
        color: Types.ui32,
      });

      const Collider = defineComponent({
        shape: Types.ui8,
      });

      state.registerComponent('renderer', Renderer);
      state.registerComponent('collider', Collider);
      state.registerConfig({
        shorthands: {
          renderer: {
            shape: 'shape',
            color: 'color',
          },
          collider: {
            shape: 'shape',
          },
        },
      });

      const recipe = {
        name: 'test-shorthand',
        components: ['renderer', 'collider'],
      };

      state.registerRecipe(recipe);

      const entity = createEntityFromRecipe(state, 'test-shorthand', {
        shape: '1',
        color: '0xff0000',
      });

      expect(Renderer.shape[entity]).toBe(1);
      expect(Collider.shape[entity]).toBe(1);
      expect(Renderer.color[entity]).toBe(0xff0000);
    });

    it('should allow explicit properties to override shorthands', () => {
      const Renderer = defineComponent({
        shape: Types.ui8,
      });

      const Collider = defineComponent({
        shape: Types.ui8,
      });

      state.registerComponent('renderer', Renderer);
      state.registerComponent('collider', Collider);
      state.registerConfig({
        shorthands: {
          renderer: {
            shape: 'shape',
          },
          collider: {
            shape: 'shape',
          },
        },
      });

      const recipe = {
        name: 'test-override',
        components: ['renderer', 'collider'],
      };

      state.registerRecipe(recipe);

      const entity = createEntityFromRecipe(state, 'test-override', {
        shape: '1',
        renderer: 'shape: 2',
      });

      expect(Renderer.shape[entity]).toBe(2);
      expect(Collider.shape[entity]).toBe(1);
    });

    it('should apply component-level shorthands', () => {
      const Renderer = defineComponent({
        sizeX: Types.f32,
        sizeY: Types.f32,
        sizeZ: Types.f32,
      });

      const Collider = defineComponent({
        sizeX: Types.f32,
        sizeY: Types.f32,
        sizeZ: Types.f32,
      });

      const plugin = {
        components: {
          Renderer,
          Collider,
        },
        config: {
          shorthands: {
            renderer: {
              size: 'size',
            },
            collider: {
              size: 'size',
            },
          },
        },
      };

      state.registerPlugin(plugin);

      const recipe = {
        name: 'test-transform',
        components: ['renderer', 'collider'],
      };

      state.registerRecipe(recipe);

      const entity = createEntityFromRecipe(state, 'test-transform', {
        size: '10 4 6',
      });

      expect(Renderer.sizeX[entity]).toBe(10);
      expect(Renderer.sizeY[entity]).toBe(4);
      expect(Renderer.sizeZ[entity]).toBe(6);

      expect(Collider.sizeX[entity]).toBe(10);
      expect(Collider.sizeY[entity]).toBe(4);
      expect(Collider.sizeZ[entity]).toBe(6);
    });
  });

  describe('JavaScript API', () => {
    it('should create entity with position and color attributes', () => {
      const Transform = defineComponent({
        posX: Types.f32,
        posY: Types.f32,
        posZ: Types.f32,
      });

      const Renderer = defineComponent({
        color: Types.ui32,
      });

      state.registerComponent('transform', Transform);
      state.registerComponent('renderer', Renderer);
      state.registerConfig({
        shorthands: {
          transform: {
            pos: 'pos',
          },
          renderer: {
            color: 'color',
          },
        },
        defaults: {
          transform: {
            posX: 0,
            posY: 0,
            posZ: 0,
          },
          renderer: {
            color: 0xffffff,
          },
        },
      });

      state.registerRecipe({
        name: 'entity',
        components: ['transform', 'renderer'],
      });

      const entity = createEntityFromRecipe(state, 'entity', {
        pos: '0 5 0',
        color: '0xff0000',
      });

      expect(state.hasComponent(entity, Transform)).toBe(true);
      expect(state.hasComponent(entity, Renderer)).toBe(true);
      expect(Transform.posX[entity]).toBe(0);
      expect(Transform.posY[entity]).toBe(5);
      expect(Transform.posZ[entity]).toBe(0);
      expect(Renderer.color[entity]).toBe(0xff0000);
    });

    it('should throw helpful error for unknown recipe', () => {
      expect(() => {
        createEntityFromRecipe(state, 'unkown-recipe', {});
      }).toThrow(/Unknown element <unkown-recipe>/);
    });

    it('should convert euler angles to quaternion', () => {
      const quat = fromEuler(0, Math.PI / 4, 0);

      expect(quat.x).toBeCloseTo(0, 5);
      expect(quat.y).toBeCloseTo(0.3827, 3);
      expect(quat.z).toBeCloseTo(0, 5);
      expect(quat.w).toBeCloseTo(0.9239, 3);
    });

    it('should handle multiple euler conversions', () => {
      const quat90 = fromEuler(0, Math.PI / 2, 0);
      expect(quat90.y).toBeCloseTo(0.7071, 3);
      expect(quat90.w).toBeCloseTo(0.7071, 3);

      const quat180 = fromEuler(0, Math.PI, 0);
      expect(quat180.y).toBeCloseTo(1, 3);
      expect(quat180.w).toBeCloseTo(0, 3);

      const quatMultiAxis = fromEuler(Math.PI / 4, Math.PI / 4, 0);
      expect(quatMultiAxis.x).toBeCloseTo(0.3536, 3);
      expect(quatMultiAxis.y).toBeCloseTo(0.3536, 3);
      expect(quatMultiAxis.z).toBeCloseTo(0.1464, 3);
      expect(quatMultiAxis.w).toBeCloseTo(0.8536, 3);
    });
  });
});
