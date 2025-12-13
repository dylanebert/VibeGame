import { beforeEach, describe, expect, it } from 'bun:test';
import type { System } from 'vibegame';
import { SystemRegistry } from 'vibegame';

describe('SystemRegistry', () => {
  let registry: SystemRegistry;

  beforeEach(() => {
    registry = new SystemRegistry();
  });

  const system1: System = {
    group: 'simulation',
    update: () => {},
  };

  const system2: System = {
    group: 'fixed',
    update: () => {},
  };

  const system3: System = {
    group: 'draw',
    update: () => {},
  };

  describe('registration', () => {
    it('should register system', () => {
      registry.add(system1);

      expect(registry.has(system1)).toBe(true);
    });

    it('should deduplicate systems (Set semantics)', () => {
      registry.add(system1);
      registry.add(system1);
      registry.add(system1);

      expect(registry.size()).toBe(1);
    });

    it('should register multiple different systems', () => {
      registry.add(system1);
      registry.add(system2);
      registry.add(system3);

      expect(registry.size()).toBe(3);
      expect(registry.has(system1)).toBe(true);
      expect(registry.has(system2)).toBe(true);
      expect(registry.has(system3)).toBe(true);
    });
  });

  describe('membership', () => {
    it('should check if system is registered', () => {
      registry.add(system1);

      expect(registry.has(system1)).toBe(true);
      expect(registry.has(system2)).toBe(false);
    });

    it('should return false for unregistered system', () => {
      const unregistered: System = {
        update: () => {},
      };

      expect(registry.has(unregistered)).toBe(false);
    });
  });

  describe('size', () => {
    it('should return number of registered systems', () => {
      expect(registry.size()).toBe(0);

      registry.add(system1);
      expect(registry.size()).toBe(1);

      registry.add(system2);
      expect(registry.size()).toBe(2);

      registry.add(system3);
      expect(registry.size()).toBe(3);
    });

    it('should not increase size for duplicate registrations', () => {
      registry.add(system1);
      registry.add(system1);
      registry.add(system1);

      expect(registry.size()).toBe(1);
    });
  });

  describe('iteration', () => {
    it('should return readonly set of systems', () => {
      registry.add(system1);
      registry.add(system2);

      const systems = registry.getSystems();
      expect(systems.has(system1)).toBe(true);
      expect(systems.has(system2)).toBe(true);
      expect(systems.size).toBe(2);
    });

    it('should support Array.from iteration', () => {
      registry.add(system1);
      registry.add(system2);
      registry.add(system3);

      const systems = registry.getSystems();
      const array = Array.from(systems);

      expect(array).toContain(system1);
      expect(array).toContain(system2);
      expect(array).toContain(system3);
      expect(array.length).toBe(3);
    });

    it('should return different instance (immutability)', () => {
      registry.add(system1);

      const systems = registry.getSystems();

      // Runtime check that set is different instance
      expect(systems).not.toBe((registry as any).systems);
    });

    it('should return empty set when no systems registered', () => {
      const systems = registry.getSystems();
      expect(systems.size).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should clear all systems', () => {
      registry.add(system1);
      registry.add(system2);
      registry.add(system3);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.has(system1)).toBe(false);
      expect(registry.has(system2)).toBe(false);
      expect(registry.has(system3)).toBe(false);
    });

    it('should allow registration after clear', () => {
      registry.add(system1);
      registry.clear();
      registry.add(system2);

      expect(registry.size()).toBe(1);
      expect(registry.has(system2)).toBe(true);
    });
  });
});
