import { beforeEach, describe, expect, it } from 'bun:test';
import { EntityRegistry } from 'vibegame';

describe('EntityRegistry', () => {
  let registry: EntityRegistry;

  beforeEach(() => {
    registry = new EntityRegistry();
  });

  describe('registration', () => {
    it('should register entity name', () => {
      registry.setName('player', 1);

      expect(registry.getByName('player')).toBe(1);
    });

    it('should allow multiple entities with different names', () => {
      registry.setName('player', 1);
      registry.setName('enemy', 2);
      registry.setName('coin', 3);

      expect(registry.getByName('player')).toBe(1);
      expect(registry.getByName('enemy')).toBe(2);
      expect(registry.getByName('coin')).toBe(3);
    });

    it('should overwrite existing name mapping', () => {
      registry.setName('target', 5);
      registry.setName('target', 10);

      expect(registry.getByName('target')).toBe(10);
      expect(registry.getName(5)).toBeUndefined();
      expect(registry.getName(10)).toBe('target');
    });

    it('should handle entity rename (entity gets new name)', () => {
      registry.setName('old-name', 1);
      registry.setName('new-name', 1);

      expect(registry.getByName('new-name')).toBe(1);
      expect(registry.getByName('old-name')).toBeNull();
      expect(registry.getName(1)).toBe('new-name');
    });

    it('should handle name reuse (name assigned to different entity)', () => {
      registry.setName('hero', 1);
      registry.setName('hero', 2);

      expect(registry.getByName('hero')).toBe(2);
      expect(registry.getName(1)).toBeUndefined();
      expect(registry.getName(2)).toBe('hero');
    });
  });

  describe('lookup', () => {
    it('should retrieve entity by name', () => {
      registry.setName('camera', 42);

      expect(registry.getByName('camera')).toBe(42);
    });

    it('should return null for unknown name', () => {
      expect(registry.getByName('unknown')).toBeNull();
    });

    it('should handle entity ID zero', () => {
      registry.setName('zero-entity', 0);

      expect(registry.getByName('zero-entity')).toBe(0);
    });
  });

  describe('reverse lookup', () => {
    it('should find entity name by ID in O(1) time', () => {
      registry.setName('player', 1);
      registry.setName('enemy', 2);

      expect(registry.getName(1)).toBe('player');
      expect(registry.getName(2)).toBe('enemy');
    });

    it('should return undefined for entity without name', () => {
      expect(registry.getName(999)).toBeUndefined();
    });

    it('should return undefined after entity renamed', () => {
      registry.setName('first', 1);
      registry.setName('second', 1);

      expect(registry.getName(1)).toBe('second');
    });

    it('should maintain O(1) performance with bidirectional map', () => {
      const entities: number[] = [];
      for (let i = 0; i < 1000; i++) {
        registry.setName(`entity-${i}`, i);
        entities.push(i);
      }

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        registry.getName(500);
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5);
    });
  });

  describe('iteration', () => {
    it('should return all named entities as Map', () => {
      registry.setName('player', 1);
      registry.setName('enemy', 2);

      const entities = registry.getAll();
      expect(entities.get('player')).toBe(1);
      expect(entities.get('enemy')).toBe(2);
      expect(entities.size).toBe(2);
    });

    it('should return copy of internal map (immutability)', () => {
      registry.setName('test', 1);

      const entities = registry.getAll();
      entities.set('hacker', 999);

      expect(registry.getByName('hacker')).toBeNull();
    });

    it('should return empty map when no entities named', () => {
      expect(registry.getAll().size).toBe(0);
    });

    it('should not include old names after overwrite', () => {
      registry.setName('first', 1);
      registry.setName('second', 1);

      const entities = registry.getAll();
      expect(entities.has('first')).toBe(false);
      expect(entities.has('second')).toBe(true);
      expect(entities.size).toBe(1);
    });
  });
});
