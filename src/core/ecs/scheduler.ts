import { TIME_CONSTANTS } from './constants';
import { sortSystemsByConstraints } from './ordering';
import type { State } from './state';
import { System } from './types';

export class Scheduler {
  private accumulator = 0;
  private readonly setup = new WeakSet<System>();
  private systemGroupCache = new Map<string, System[]>();
  private lastSystemsSize = 0;

  getAccumulator(): number {
    return this.accumulator;
  }

  step(state: State, deltaTime = TIME_CONSTANTS.DEFAULT_DELTA) {
    const fixedDeltaTime = TIME_CONSTANTS.FIXED_TIMESTEP;
    const mutableTime = state.time as { deltaTime: number; elapsed: number };

    mutableTime.deltaTime = deltaTime;
    mutableTime.elapsed += deltaTime;
    this.accumulator += deltaTime;

    this.runSystemGroup(state, 'setup');

    while (this.accumulator >= fixedDeltaTime) {
      mutableTime.deltaTime = fixedDeltaTime;
      this.runSystemGroup(state, 'fixed');
      this.accumulator -= fixedDeltaTime;
    }

    mutableTime.deltaTime = deltaTime;
    this.runSystemGroup(state, 'simulation');
    this.runSystemGroup(state, 'draw');
  }

  private runSystemGroup(
    state: State,
    group: 'setup' | 'simulation' | 'fixed' | 'draw'
  ) {
    const systems = this.getSystemsByGroup(state, group);
    for (const system of systems) {
      if (!this.setup.has(system)) {
        system.setup?.(state);
        this.setup.add(system);
      }
      system.update?.(state);
    }
  }

  private getSystemsByGroup(
    state: State,
    group: 'setup' | 'simulation' | 'fixed' | 'draw'
  ): System[] {
    if (state.systems.size !== this.lastSystemsSize) {
      this.systemGroupCache.clear();
      this.lastSystemsSize = state.systems.size;
    }

    const cacheKey = group;
    if (this.systemGroupCache.has(cacheKey)) {
      return this.systemGroupCache.get(cacheKey)!;
    }

    const allSystems = Array.from(state.systems);
    const systems = allSystems.filter(
      (system) => (system.group ?? 'simulation') === group
    );

    const sorted = sortSystemsByConstraints(systems, group, allSystems);
    this.systemGroupCache.set(cacheKey, sorted);
    return sorted;
  }
}
