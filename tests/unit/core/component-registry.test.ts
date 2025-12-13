import { defineComponent, Types, type Component } from 'bitecs';
import { beforeEach, describe, expect, it } from 'bun:test';
import { ComponentRegistry } from 'vibegame';

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  const TestComponent = defineComponent({
    value: Types.f32,
  });

  const AnotherComponent = defineComponent({
    x: Types.f32,
  });

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  describe('registration', () => {
    it('should register component with kebab-case conversion', () => {
      registry.register('TestComponent', TestComponent);

      const retrieved = registry.get('test-component');
      expect(retrieved).toBe(TestComponent);
    });

    it('should register component that is already kebab-case', () => {
      registry.register('my-component', TestComponent);

      const retrieved = registry.get('my-component');
      expect(retrieved).toBe(TestComponent);
    });

    it('should handle duplicate registration by overwriting', () => {
      registry.register('test', TestComponent);
      registry.register('test', AnotherComponent);

      expect(registry.get('test')).toBe(AnotherComponent);
    });

    it('should handle registration with mixed case names', () => {
      registry.register('MyTestComponent', TestComponent);

      expect(registry.get('my-test-component')).toBe(TestComponent);
      expect(registry.get('MyTestComponent')).toBe(TestComponent);
    });

    it('should clean up old reverse mapping on overwrite', () => {
      registry.register('first-name', TestComponent);
      registry.register('first-name', AnotherComponent);

      expect(registry.getName(TestComponent)).toBeUndefined();
      expect(registry.getName(AnotherComponent)).toBe('first-name');
    });
  });

  describe('lookup', () => {
    it('should retrieve registered component', () => {
      registry.register('health', TestComponent);

      expect(registry.get('health')).toBe(TestComponent);
    });

    it('should return undefined for unknown component', () => {
      expect(registry.get('unknown')).toBeUndefined();
    });

    it('should apply kebab-case to lookup queries', () => {
      registry.register('myComponent', TestComponent);

      expect(registry.get('myComponent')).toBe(TestComponent);
      expect(registry.get('my-component')).toBe(TestComponent);
    });

    it('should handle underscores in component names', () => {
      registry.register('my_test_component', TestComponent);

      expect(registry.get('my-test-component')).toBe(TestComponent);
    });
  });

  describe('reverse lookup', () => {
    it('should find component name by reference in O(1) time', () => {
      registry.register('health', TestComponent);
      registry.register('position', AnotherComponent);

      expect(registry.getName(TestComponent)).toBe('health');
      expect(registry.getName(AnotherComponent)).toBe('position');
    });

    it('should return undefined for unregistered component', () => {
      const Unregistered = defineComponent({ val: Types.f32 });

      expect(registry.getName(Unregistered)).toBeUndefined();
    });

    it('should return kebab-cased name', () => {
      registry.register('MyTestComponent', TestComponent);

      expect(registry.getName(TestComponent)).toBe('my-test-component');
    });

    it('should maintain O(1) performance with bidirectional map', () => {
      const components: Component[] = [];
      for (let i = 0; i < 1000; i++) {
        const comp = defineComponent({ val: Types.f32 });
        registry.register(`component-${i}`, comp);
        components.push(comp);
      }

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        registry.getName(components[500]);
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5);
    });
  });

  describe('iteration', () => {
    it('should return all registered component names', () => {
      registry.register('health', TestComponent);
      registry.register('position', AnotherComponent);

      const names = registry.getNames();
      expect(names).toContain('health');
      expect(names).toContain('position');
      expect(names.length).toBe(2);
    });

    it('should return empty array when no components registered', () => {
      expect(registry.getNames()).toEqual([]);
    });

    it('should return names in kebab-case format', () => {
      registry.register('MyTestComponent', TestComponent);

      const names = registry.getNames();
      expect(names).toContain('my-test-component');
      expect(names).not.toContain('MyTestComponent');
    });

    it('should not include duplicate names after overwrite', () => {
      registry.register('test', TestComponent);
      registry.register('test', AnotherComponent);

      const names = registry.getNames();
      expect(names.filter((n) => n === 'test').length).toBe(1);
    });
  });
});
