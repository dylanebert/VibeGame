import type { System } from './types';

export class SystemRegistry {
  private readonly systems = new Set<System>();

  add(system: System): void {
    this.systems.add(system);
  }

  has(system: System): boolean {
    return this.systems.has(system);
  }

  size(): number {
    return this.systems.size;
  }

  getSystems(): ReadonlySet<System> {
    return new Set(this.systems);
  }

  clear(): void {
    this.systems.clear();
  }
}
