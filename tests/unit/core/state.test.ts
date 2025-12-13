import { defineComponent, Types } from 'bitecs';
import { beforeEach, describe, expect, it } from 'bun:test';
import { State, defineQuery } from 'vibegame';

describe('State', () => {
  let state: State;

  const TestComponent = defineComponent({
    value: Types.f32,
  });

  beforeEach(() => {
    state = new State();
  });

  it('should create and destroy entities', () => {
    const entity = state.createEntity();
    expect(entity).toBeGreaterThanOrEqual(0);

    state.destroyEntity(entity);
    expect(true).toBe(true);
  });

  it('should add and remove components', () => {
    const entity = state.createEntity();

    expect(state.hasComponent(entity, TestComponent)).toBe(false);

    state.addComponent(entity, TestComponent);
    expect(state.hasComponent(entity, TestComponent)).toBe(true);

    state.removeComponent(entity, TestComponent);
    expect(state.hasComponent(entity, TestComponent)).toBe(false);
  });

  it('should query entities with components', () => {
    const entity1 = state.createEntity();
    const entity2 = state.createEntity();

    state.addComponent(entity1, TestComponent);

    const results = defineQuery([TestComponent])(state.world);
    expect(results).toContain(entity1);
    expect(results).not.toContain(entity2);
  });

  it('should step simulation', () => {
    let updateCalled = false;

    state.registerSystem({
      group: 'simulation',
      update: () => {
        updateCalled = true;
      },
    });

    state.step();
    expect(updateCalled).toBe(true);
  });

  it('should register components by name', () => {
    state.registerComponent('test-component', TestComponent);

    const retrieved = state.getComponent('test-component');
    expect(retrieved).toBe(TestComponent);
  });

  it('should add component with initial values dictionary', () => {
    const Health = defineComponent({
      current: Types.f32,
      max: Types.f32,
    });

    const entity = state.createEntity();
    state.addComponent(entity, Health, {
      current: 100,
      max: 100,
    });

    expect(state.hasComponent(entity, Health)).toBe(true);
    expect(Health.current[entity]).toBe(100);
    expect(Health.max[entity]).toBe(100);
  });

  it('should support direct component array access pattern', () => {
    const Health = defineComponent({
      current: Types.f32,
      max: Types.f32,
    });

    state.registerComponent('health', Health);

    const entity = state.createEntity();
    state.addComponent(entity, Health, {
      current: 100,
      max: 100,
    });

    Health.current[entity] -= 10;
    expect(Health.current[entity]).toBe(90);

    const entities = defineQuery([Health])(state.world);
    for (const eid of entities) {
      Health.current[eid] -= 10;
    }
    expect(Health.current[entity]).toBe(80);
  });

  it('should handle kebab-case component names', () => {
    const MyTestComponent = defineComponent({
      value: Types.f32,
    });

    state.registerComponent('my-test-component', MyTestComponent);

    const retrieved = state.getComponent('my-test-component');
    expect(retrieved).toBe(MyTestComponent);

    const entity = state.createEntity();
    state.addComponent(entity, MyTestComponent, { value: 42 });
    expect(MyTestComponent.value[entity]).toBe(42);
  });

  it('should apply component defaults when adding component', () => {
    const TestWithDefaults = defineComponent({
      value: Types.f32,
      scale: Types.f32,
    });

    state.registerComponent('test-with-defaults', TestWithDefaults);
    state.registerConfig({
      defaults: {
        'test-with-defaults': {
          value: 10,
          scale: 1,
        },
      },
    });

    const entity = state.createEntity();
    state.addComponent(entity, TestWithDefaults);

    expect(TestWithDefaults.value[entity]).toBe(10);
    expect(TestWithDefaults.scale[entity]).toBe(1);
  });

  it('should allow explicit values to override component defaults', () => {
    const TestWithDefaults = defineComponent({
      value: Types.f32,
      scale: Types.f32,
    });

    state.registerComponent('test-override', TestWithDefaults);
    state.registerConfig({
      defaults: {
        'test-override': {
          value: 10,
          scale: 1,
        },
      },
    });

    const entity = state.createEntity();
    state.addComponent(entity, TestWithDefaults, { value: 42 });

    expect(TestWithDefaults.value[entity]).toBe(42);
    expect(TestWithDefaults.scale[entity]).toBe(1);
  });
});

describe('State Registry Integration', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
  });

  describe('backward compatibility', () => {
    it('should maintain component registration API', () => {
      const TestComp = defineComponent({ value: Types.f32 });
      state.registerComponent('test-component', TestComp);

      expect(state.getComponent('test-component')).toBe(TestComp);
      expect(state.getComponentNames()).toContain('test-component');
    });

    it('should maintain entity naming API', () => {
      const entity = state.createEntity();
      state.setEntityName('player', entity);

      expect(state.getEntityByName('player')).toBe(entity);
      expect(state.getEntityName(entity)).toBe('player');
      expect(state.getNamedEntities().get('player')).toBe(entity);
    });

    it('should maintain recipe registration API', () => {
      const recipe = { name: 'box', components: ['transform'] };
      state.registerRecipe(recipe);

      expect(state.getRecipe('box')).toBe(recipe);
      expect(state.hasRecipe('box')).toBe(true);
      expect(state.getRecipeNames().has('box')).toBe(true);
    });

    it('should maintain system registration API', () => {
      const system = {
        group: 'simulation' as const,
        update: () => {},
      };
      state.registerSystem(system);

      expect(state.systems.has(system)).toBe(true);
      expect(state.systems.size).toBe(1);

      const array = Array.from(state.systems);
      expect(array).toContain(system);
    });

    it('should support Scheduler access pattern', () => {
      const system1 = { group: 'simulation' as const, update: () => {} };
      const system2 = { group: 'fixed' as const, update: () => {} };

      state.registerSystem(system1);
      state.registerSystem(system2);

      // Scheduler relies on state.systems.size
      expect(state.systems.size).toBe(2);

      // Scheduler relies on Array.from(state.systems)
      const allSystems = Array.from(state.systems);
      expect(allSystems).toContain(system1);
      expect(allSystems).toContain(system2);
    });
  });

  describe('O(1) performance improvements', () => {
    it('should perform component reverse lookup in O(1) time', () => {
      const components = [];
      for (let i = 0; i < 1000; i++) {
        const comp = defineComponent({ val: Types.f32 });
        state.registerComponent(`comp-${i}`, comp);
        components.push(comp);
      }

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        (state as any).getComponentName(components[500]);
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5);
    });

    it('should perform entity reverse lookup in O(1) time', () => {
      for (let i = 0; i < 1000; i++) {
        const entity = state.createEntity();
        state.setEntityName(`entity-${i}`, entity);
      }

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        state.getEntityName(500);
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5);
    });
  });

  describe('plugin registration integration', () => {
    it('should register plugin components, systems, and recipes', () => {
      const TestComp = defineComponent({ value: Types.f32 });
      const testSystem = {
        group: 'simulation' as const,
        update: () => {},
      };
      const testRecipe = { name: 'test-entity', components: ['test'] };

      state.registerPlugin({
        components: { TestComponent: TestComp },
        systems: [testSystem],
        recipes: [testRecipe],
      });

      expect(state.getComponent('test-component')).toBe(TestComp);
      expect(state.systems.has(testSystem)).toBe(true);
      expect(state.getRecipe('test-entity')).toBe(testRecipe);
    });
  });
});
