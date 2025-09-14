import { beforeEach, describe, expect, it } from 'bun:test';
import { State, System, TIME_CONSTANTS } from 'vibegame';

describe('System Ordering Integration', () => {
  let state: State;
  let executionOrder: string[];

  beforeEach(() => {
    state = new State();
    executionOrder = [];
  });

  describe('Fixed vs Simulation Systems', () => {
    it('should run fixed systems at fixed timestep', () => {
      let fixedCount = 0;
      let simulationCount = 0;

      const fixedSystem: System = {
        group: 'fixed',
        update: () => {
          fixedCount++;
        },
      };

      const simulationSystem: System = {
        group: 'simulation',
        update: () => {
          simulationCount++;
        },
      };

      state.registerSystem(fixedSystem);
      state.registerSystem(simulationSystem);

      state.step(0.1);

      expect(fixedCount).toBeGreaterThan(1);
      expect(fixedCount).toBeLessThanOrEqual(7);
      expect(simulationCount).toBe(1);
    });

    it('should accumulate time for fixed timestep', () => {
      let fixedRuns = 0;

      const fixedSystem: System = {
        group: 'fixed',
        update: () => {
          fixedRuns++;
        },
      };

      state.registerSystem(fixedSystem);

      // Step with less than half the fixed timestep - no fixed update
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP * 0.49);
      expect(fixedRuns).toBe(0);

      // Step to accumulate just over one fixed timestep
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP * 0.52);
      expect(fixedRuns).toBe(1);

      // Step with less than half again - no new fixed update
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP * 0.49);
      expect(fixedRuns).toBe(1);

      // Step to accumulate another fixed timestep
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP * 0.52);
      expect(fixedRuns).toBe(2);
    });
  });

  describe('System Ordering Constraints', () => {
    it('should respect first constraint', () => {
      const firstSystem: System = {
        group: 'simulation',
        first: true,
        update: () => {
          executionOrder.push('first');
        },
      };

      const normalSystem: System = {
        group: 'simulation',
        update: () => {
          executionOrder.push('normal');
        },
      };

      state.registerSystem(normalSystem);
      state.registerSystem(firstSystem);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(executionOrder[0]).toBe('first');
      expect(executionOrder[1]).toBe('normal');
    });

    it('should respect last constraint', () => {
      const normalSystem: System = {
        group: 'simulation',
        update: () => {
          executionOrder.push('normal');
        },
      };

      const lastSystem: System = {
        group: 'simulation',
        last: true,
        update: () => {
          executionOrder.push('last');
        },
      };

      state.registerSystem(lastSystem);
      state.registerSystem(normalSystem);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(executionOrder[0]).toBe('normal');
      expect(executionOrder[1]).toBe('last');
    });

    it('should respect before constraint', () => {
      const systemB: System = {
        group: 'simulation',
        update: () => {
          executionOrder.push('B');
        },
      };

      const systemA: System = {
        group: 'simulation',
        before: [systemB],
        update: () => {
          executionOrder.push('A');
        },
      };

      state.registerSystem(systemB);
      state.registerSystem(systemA);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(executionOrder[0]).toBe('A');
      expect(executionOrder[1]).toBe('B');
    });

    it('should respect after constraint', () => {
      const systemA: System = {
        group: 'simulation',
        update: () => {
          executionOrder.push('A');
        },
      };

      const systemB: System = {
        group: 'simulation',
        after: [systemA],
        update: () => {
          executionOrder.push('B');
        },
      };

      state.registerSystem(systemB);
      state.registerSystem(systemA);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(executionOrder[0]).toBe('A');
      expect(executionOrder[1]).toBe('B');
    });

    it('should handle complex ordering constraints', () => {
      const systemA: System = {
        group: 'simulation',
        update: () => {
          executionOrder.push('A');
        },
      };

      const systemB: System = {
        group: 'simulation',
        after: [systemA],
        update: () => {
          executionOrder.push('B');
        },
      };

      const systemC: System = {
        group: 'simulation',
        after: [systemB],
        update: () => {
          executionOrder.push('C');
        },
      };

      const systemD: System = {
        group: 'simulation',
        before: [systemC],
        after: [systemA],
        update: () => {
          executionOrder.push('D');
        },
      };

      state.registerSystem(systemC);
      state.registerSystem(systemD);
      state.registerSystem(systemA);
      state.registerSystem(systemB);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      const indexA = executionOrder.indexOf('A');
      const indexB = executionOrder.indexOf('B');
      const indexC = executionOrder.indexOf('C');
      const indexD = executionOrder.indexOf('D');

      expect(indexA).toBeLessThan(indexB);
      expect(indexB).toBeLessThan(indexC);
      expect(indexA).toBeLessThan(indexD);
      expect(indexD).toBeLessThan(indexC);
    });
  });

  describe('System Groups', () => {
    it('should run setup systems only once', () => {
      let setupCount = 0;

      const setupSystem: System = {
        group: 'setup',
        setup: () => {
          setupCount++;
        },
        update: () => {},
      };

      state.registerSystem(setupSystem);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(setupCount).toBe(1);
    });

    it('should run systems in group order', () => {
      const setupSystem: System = {
        group: 'setup',
        update: () => {
          executionOrder.push('setup');
        },
      };

      const fixedSystem: System = {
        group: 'fixed',
        update: () => {
          executionOrder.push('fixed');
        },
      };

      const simulationSystem: System = {
        group: 'simulation',
        update: () => {
          executionOrder.push('simulation');
        },
      };

      const drawSystem: System = {
        group: 'draw',
        update: () => {
          executionOrder.push('draw');
        },
      };

      state.registerSystem(drawSystem);
      state.registerSystem(simulationSystem);
      state.registerSystem(fixedSystem);
      state.registerSystem(setupSystem);

      state.step(0.017);

      const setupIndex = executionOrder.indexOf('setup');
      const fixedIndex = executionOrder.indexOf('fixed');
      const simulationIndex = executionOrder.indexOf('simulation');
      const drawIndex = executionOrder.indexOf('draw');

      expect(setupIndex).toBeLessThan(simulationIndex);
      expect(fixedIndex).toBeLessThan(simulationIndex);
      expect(simulationIndex).toBeLessThan(drawIndex);
    });
  });

  describe('Timestep Usage Patterns', () => {
    it('should use fixedDeltaTime for physics and deltaTime for animations', () => {
      let fixedDelta = 0;
      let frameDelta = 0;
      let drawDelta = 0;

      const physicsSystem: System = {
        group: 'fixed',
        update: (state) => {
          fixedDelta = state.time.fixedDeltaTime;
        },
      };

      const animationSystem: System = {
        group: 'simulation',
        update: (state) => {
          frameDelta = state.time.deltaTime;
        },
      };

      const renderSystem: System = {
        group: 'draw',
        update: (state) => {
          drawDelta = state.time.deltaTime;
        },
      };

      state.registerSystem(physicsSystem);
      state.registerSystem(animationSystem);
      state.registerSystem(renderSystem);

      // Step with a time that won't trigger fixed update at 50Hz
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP * 1.5);

      // Fixed system should have run once
      expect(fixedDelta).toBeCloseTo(TIME_CONSTANTS.FIXED_TIMESTEP, 5);
      expect(frameDelta).toBeCloseTo(TIME_CONSTANTS.FIXED_TIMESTEP * 1.5, 5);
      expect(drawDelta).toBeCloseTo(TIME_CONSTANTS.FIXED_TIMESTEP * 1.5, 5);

      state.step(0.008);

      expect(frameDelta).toBeCloseTo(0.008, 5);
      expect(drawDelta).toBeCloseTo(0.008, 5);
    });
  });

  describe('System Lifecycle', () => {
    it('should call setup once and dispose on cleanup', () => {
      let setupCount = 0;
      let disposeCount = 0;
      let updateCount = 0;

      const lifecycleSystem: System = {
        group: 'simulation',
        setup: () => {
          setupCount++;
        },
        update: () => {
          updateCount++;
        },
        dispose: () => {
          disposeCount++;
        },
      };

      state.registerSystem(lifecycleSystem);

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      expect(updateCount).toBe(2);
      expect(setupCount).toBe(1);

      state.dispose();
      expect(disposeCount).toBe(1);
    });
  });

  describe('Fixed Timestep Consistency', () => {
    it('should maintain consistent fixed timestep regardless of frame time', () => {
      const fixedDeltas: number[] = [];

      const fixedSystem: System = {
        group: 'fixed',
        update: (state) => {
          fixedDeltas.push(state.time.fixedDeltaTime);
        },
      };

      state.registerSystem(fixedSystem);

      state.step(0.008);
      state.step(0.017);
      state.step(0.024);
      state.step(0.032);

      const uniqueDeltas = [...new Set(fixedDeltas)];
      expect(uniqueDeltas.length).toBe(1);
      expect(uniqueDeltas[0]).toBeCloseTo(TIME_CONSTANTS.FIXED_TIMESTEP, 5);
    });

    it('should catch up when frame time is large', () => {
      let fixedCount = 0;

      const fixedSystem: System = {
        group: 'fixed',
        update: () => {
          fixedCount++;
        },
      };

      state.registerSystem(fixedSystem);

      // Step with time larger than fixed timestep
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP * 1.5);
      expect(fixedCount).toBe(1);
    });

    it('should cap maximum fixed steps per frame', () => {
      let fixedCount = 0;

      const fixedSystem: System = {
        group: 'fixed',
        update: () => {
          fixedCount++;
        },
      };

      state.registerSystem(fixedSystem);

      state.step(1.0);
      expect(fixedCount).toBeLessThanOrEqual(60);
    });
  });
});
