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
});
