import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, System, defineQuery } from 'vibegame';
import {
  InputPlugin,
  InputState,
  INPUT_CONFIG,
  consumeJump,
  consumePrimary,
  consumeSecondary,
  handleMouseMove,
  handleMouseDown,
  handleMouseUp,
  handleWheel,
  setTargetCanvas,
  setFocusedCanvas,
} from 'vibegame/input';
import { setRenderingCanvas } from 'vibegame/rendering';
import { handleKeyDown, clearAllInput } from '../../../src/plugins/input/utils';

describe('Input Plugin', () => {
  let state: State;
  let entity: number;

  beforeEach(() => {
    const dom = new JSDOM(
      '<!DOCTYPE html><html><body><canvas id="game-canvas"></canvas></body></html>'
    );
    global.window = dom.window as any;
    global.document = dom.window.document;
    global.performance = {
      now: () => Date.now(),
    } as any;

    state = new State();
    state.registerPlugin(InputPlugin);
    entity = state.createEntity();
    state.addComponent(entity, InputState);

    const InputSystem = Array.from(state.systems).find(
      (s) => s.group === 'simulation'
    );
    InputSystem?.setup?.(state);

    const canvas = global.document.getElementById(
      'game-canvas'
    ) as HTMLCanvasElement;
    setTargetCanvas(canvas);
    setFocusedCanvas(canvas);
    setRenderingCanvas(state, canvas);
  });

  describe('Plugin Registration', () => {
    it('should register InputPlugin with state', () => {
      const newState = new State();
      newState.registerPlugin(InputPlugin);
      const testEntity = newState.createEntity();
      newState.addComponent(testEntity, InputState);

      expect(newState.hasComponent(testEntity, InputState)).toBe(true);
    });
  });

  describe('InputState Component', () => {
    it('should initialize with default values', () => {
      expect(InputState.moveX[entity]).toBe(0);
      expect(InputState.moveY[entity]).toBe(0);
      expect(InputState.moveZ[entity]).toBe(0);
      expect(InputState.lookX[entity]).toBe(0);
      expect(InputState.lookY[entity]).toBe(0);
      expect(InputState.scrollDelta[entity]).toBe(0);
      expect(InputState.jump[entity]).toBe(0);
      expect(InputState.primaryAction[entity]).toBe(0);
      expect(InputState.secondaryAction[entity]).toBe(0);
      expect(InputState.leftMouse[entity]).toBe(0);
      expect(InputState.rightMouse[entity]).toBe(0);
      expect(InputState.middleMouse[entity]).toBe(0);
    });

    it('should store movement axes values', () => {
      InputState.moveX[entity] = 1;
      InputState.moveY[entity] = -1;
      InputState.moveZ[entity] = 0.5;

      expect(InputState.moveX[entity]).toBe(1);
      expect(InputState.moveY[entity]).toBe(-1);
      expect(InputState.moveZ[entity]).toBe(0.5);
    });

    it('should store look and scroll values', () => {
      InputState.lookX[entity] = 10;
      InputState.lookY[entity] = -5;
      InputState.scrollDelta[entity] = 2;

      expect(InputState.lookX[entity]).toBe(10);
      expect(InputState.lookY[entity]).toBe(-5);
      expect(InputState.scrollDelta[entity]).toBe(2);
    });

    it('should store action states', () => {
      InputState.jump[entity] = 1;
      InputState.primaryAction[entity] = 1;
      InputState.secondaryAction[entity] = 1;

      expect(InputState.jump[entity]).toBe(1);
      expect(InputState.primaryAction[entity]).toBe(1);
      expect(InputState.secondaryAction[entity]).toBe(1);
    });

    it('should store mouse button states', () => {
      InputState.leftMouse[entity] = 1;
      InputState.rightMouse[entity] = 1;
      InputState.middleMouse[entity] = 1;

      expect(InputState.leftMouse[entity]).toBe(1);
      expect(InputState.rightMouse[entity]).toBe(1);
      expect(InputState.middleMouse[entity]).toBe(1);
    });

    it('should track buffer times', () => {
      InputState.jumpBufferTime[entity] = 1000;
      InputState.primaryBufferTime[entity] = 2000;
      InputState.secondaryBufferTime[entity] = 3000;

      expect(InputState.jumpBufferTime[entity]).toBe(1000);
      expect(InputState.primaryBufferTime[entity]).toBe(2000);
      expect(InputState.secondaryBufferTime[entity]).toBe(3000);
    });
  });

  describe('Reading Input in Custom Systems', () => {
    it('should allow querying input entities', () => {
      const entity2 = state.createEntity();
      state.addComponent(entity2, InputState);

      const results = defineQuery([InputState])(state.world);
      expect(results).toContain(entity);
      expect(results).toContain(entity2);
      expect(results.length).toBe(2);
    });

    it('should work with custom player control system', () => {
      let capturedMoveX = 0;
      let capturedMoveY = 0;
      let jumpDetected = false;
      let leftMouseDetected = false;

      const PlayerControlSystem: System = {
        update: (state) => {
          const players = defineQuery([InputState])(state.world);

          for (const player of players) {
            capturedMoveX = InputState.moveX[player];
            capturedMoveY = InputState.moveY[player];

            if (InputState.jump[player]) {
              jumpDetected = true;
            }

            if (InputState.leftMouse[player]) {
              leftMouseDetected = true;
            }
          }
        },
      };

      InputState.moveX[entity] = 1;
      InputState.moveY[entity] = -1;
      InputState.jump[entity] = 1;
      InputState.leftMouse[entity] = 1;

      PlayerControlSystem.update!(state);

      expect(capturedMoveX).toBe(1);
      expect(capturedMoveY).toBe(-1);
      expect(jumpDetected).toBe(true);
      expect(leftMouseDetected).toBe(true);
    });
  });

  describe('Buffered Actions', () => {
    it('should consume jump when available', () => {
      global.performance.now = () => 0;
      clearAllInput();
      global.performance.now = () => 100;
      const jumpEvent = {
        code: 'Space',
        preventDefault: () => {},
      } as KeyboardEvent;
      handleKeyDown(jumpEvent);

      global.performance.now = () => 150;

      expect(consumeJump()).toBe(true);
      expect(consumeJump()).toBe(false);
    });

    it('should not consume jump outside buffer window', () => {
      global.performance.now = () => 0;
      clearAllInput();
      global.performance.now = () => 100;
      const jumpEvent = {
        code: 'Space',
        preventDefault: () => {},
      } as KeyboardEvent;
      handleKeyDown(jumpEvent);

      global.performance.now = () => 250;

      expect(consumeJump()).toBe(false);
    });

    it('should consume primary action when available', () => {
      global.performance.now = () => 0;
      clearAllInput();
      global.performance.now = () => 100;
      const mouseEvent = { button: 0, preventDefault: () => {} } as MouseEvent;
      handleMouseDown(mouseEvent);

      global.performance.now = () => 150;

      expect(consumePrimary()).toBe(true);
      expect(consumePrimary()).toBe(false);
    });

    it('should consume secondary action when available', () => {
      global.performance.now = () => 0;
      clearAllInput();
      global.performance.now = () => 100;
      const mouseEvent = { button: 2, preventDefault: () => {} } as MouseEvent;
      handleMouseDown(mouseEvent);

      global.performance.now = () => 150;

      expect(consumeSecondary()).toBe(true);
      expect(consumeSecondary()).toBe(false);
    });

    it('should handle combat system example', () => {
      let jumpPerformed = false;
      let projectileSpawned = false;

      const CombatSystem: System = {
        update: () => {
          if (consumeJump()) {
            jumpPerformed = true;
          }

          if (consumePrimary()) {
            projectileSpawned = true;
          }
        },
      };

      global.performance.now = () => 0;
      clearAllInput();
      global.performance.now = () => 100;
      const jumpEvent = {
        code: 'Space',
        preventDefault: () => {},
      } as KeyboardEvent;
      handleKeyDown(jumpEvent);

      const mouseEvent = { button: 0, preventDefault: () => {} } as MouseEvent;
      handleMouseDown(mouseEvent);

      global.performance.now = () => 150;

      CombatSystem.update!(state);

      expect(jumpPerformed).toBe(true);
      expect(projectileSpawned).toBe(true);

      jumpPerformed = false;
      projectileSpawned = false;
      CombatSystem.update!(state);

      expect(jumpPerformed).toBe(false);
      expect(projectileSpawned).toBe(false);
    });
  });

  describe('Input Configuration', () => {
    it('should have correct default key mappings', () => {
      expect(INPUT_CONFIG.mappings.jump).toEqual(['Space']);
      expect(INPUT_CONFIG.mappings.moveForward).toEqual(['KeyW', 'ArrowUp']);
      expect(INPUT_CONFIG.mappings.moveBackward).toEqual(['KeyS', 'ArrowDown']);
      expect(INPUT_CONFIG.mappings.moveLeft).toEqual(['KeyA', 'ArrowLeft']);
      expect(INPUT_CONFIG.mappings.moveRight).toEqual(['KeyD', 'ArrowRight']);
    });

    it('should have correct default mouse sensitivity', () => {
      expect(INPUT_CONFIG.mouseSensitivity.look).toBe(0.5);
      expect(INPUT_CONFIG.mouseSensitivity.scroll).toBe(0.01);
    });

    it('should have correct default buffer window', () => {
      expect(INPUT_CONFIG.bufferWindow).toBe(100);
    });

    it('should have correct default grace periods', () => {
      expect(INPUT_CONFIG.gracePeriods.coyoteTime).toBe(100);
      expect(INPUT_CONFIG.gracePeriods.landingBuffer).toBe(50);
    });

    it('should have correct default action mappings', () => {
      expect(INPUT_CONFIG.mappings.moveUp).toEqual(['KeyE']);
      expect(INPUT_CONFIG.mappings.moveDown).toEqual(['KeyQ']);
      expect(INPUT_CONFIG.mappings.primaryAction).toEqual(['MouseLeft']);
      expect(INPUT_CONFIG.mappings.secondaryAction).toEqual(['MouseRight']);
    });
  });

  describe('Event Handlers', () => {
    it('should handle mouse move events', () => {
      const event1 = { movementX: 10, movementY: -5 } as MouseEvent;
      const event2 = { movementX: 10, movementY: -5 } as MouseEvent;

      handleMouseMove(event1);
      handleMouseMove(event2);

      const InputSystem = Array.from(state.systems).find(
        (s) => s.group === 'simulation'
      );
      InputSystem?.update?.(state);

      expect(InputState.lookX[entity]).toBe(
        20 * INPUT_CONFIG.mouseSensitivity.look
      );
      expect(InputState.lookY[entity]).toBe(
        -10 * INPUT_CONFIG.mouseSensitivity.look
      );
    });

    it('should handle mouse down events', () => {
      const leftMouseEvent = new (global.window as any).MouseEvent(
        'mousedown',
        { button: 0 }
      );
      const rightMouseEvent = new (global.window as any).MouseEvent(
        'mousedown',
        { button: 2 }
      );
      const middleMouseEvent = new (global.window as any).MouseEvent(
        'mousedown',
        { button: 1 }
      );

      handleMouseDown(leftMouseEvent);
      handleMouseDown(rightMouseEvent);
      handleMouseDown(middleMouseEvent);

      const InputSystem = Array.from(state.systems).find(
        (s) => s.group === 'simulation'
      );
      InputSystem?.update?.(state);

      expect(InputState.leftMouse[entity]).toBe(1);
      expect(InputState.rightMouse[entity]).toBe(1);
      expect(InputState.middleMouse[entity]).toBe(1);
    });

    it('should handle mouse up events', () => {
      const leftDownEvent = new (global.window as any).MouseEvent('mousedown', {
        button: 0,
      });
      const rightDownEvent = new (global.window as any).MouseEvent(
        'mousedown',
        { button: 2 }
      );

      handleMouseDown(leftDownEvent);
      handleMouseDown(rightDownEvent);

      const InputSystem = Array.from(state.systems).find(
        (s) => s.group === 'simulation'
      );
      InputSystem?.update?.(state);

      expect(InputState.leftMouse[entity]).toBe(1);
      expect(InputState.rightMouse[entity]).toBe(1);

      const leftUpEvent = new (global.window as any).MouseEvent('mouseup', {
        button: 0,
      });
      const rightUpEvent = new (global.window as any).MouseEvent('mouseup', {
        button: 2,
      });

      handleMouseUp(leftUpEvent);
      handleMouseUp(rightUpEvent);

      InputSystem?.update?.(state);

      expect(InputState.leftMouse[entity]).toBe(0);
      expect(InputState.rightMouse[entity]).toBe(0);
    });

    it('should handle wheel events', () => {
      const event = { deltaY: 100, preventDefault: () => {} } as WheelEvent;

      handleWheel(event);
      handleWheel(event);

      const InputSystem = Array.from(state.systems).find(
        (s) => s.group === 'simulation'
      );
      InputSystem?.update?.(state);

      expect(InputState.scrollDelta[entity]).toBe(
        200 * INPUT_CONFIG.mouseSensitivity.scroll
      );
    });

    it('should accumulate mouse deltas correctly', () => {
      const moveEvent1 = { movementX: 5, movementY: 3 } as MouseEvent;
      const moveEvent2 = { movementX: -2, movementY: 4 } as MouseEvent;

      handleMouseMove(moveEvent1);
      handleMouseMove(moveEvent2);

      const InputSystem = Array.from(state.systems).find(
        (s) => s.group === 'simulation'
      );
      InputSystem?.update?.(state);

      expect(InputState.lookX[entity]).toBe(
        3 * INPUT_CONFIG.mouseSensitivity.look
      );
      expect(InputState.lookY[entity]).toBe(
        7 * INPUT_CONFIG.mouseSensitivity.look
      );
    });

    it('should reset frame deltas after update', () => {
      const moveEvent = { movementX: 10, movementY: 10 } as MouseEvent;
      const wheelEvent = {
        deltaY: 100,
        preventDefault: () => {},
      } as WheelEvent;

      handleMouseMove(moveEvent);
      handleWheel(wheelEvent);

      const InputSystem = Array.from(state.systems).find(
        (s) => s.group === 'simulation'
      );
      InputSystem?.update?.(state);

      expect(InputState.lookX[entity]).toBe(
        10 * INPUT_CONFIG.mouseSensitivity.look
      );
      expect(InputState.scrollDelta[entity]).toBe(
        100 * INPUT_CONFIG.mouseSensitivity.scroll
      );

      InputSystem?.update?.(state);

      expect(InputState.lookX[entity]).toBe(0);
      expect(InputState.lookY[entity]).toBe(0);
      expect(InputState.scrollDelta[entity]).toBe(0);
    });
  });

  describe('Manual Event Handling', () => {
    it('should allow direct use of event handlers', () => {
      const canvas = global.document.createElement('canvas');

      let mouseDownCalled = false;
      let mouseUpCalled = false;

      const originalHandleMouseDown = handleMouseDown;
      const originalHandleMouseUp = handleMouseUp;

      (global as any).handleMouseDown = () => {
        mouseDownCalled = true;
      };
      (global as any).handleMouseUp = () => {
        mouseUpCalled = true;
      };

      canvas.addEventListener('mousedown', (global as any).handleMouseDown);
      canvas.addEventListener('mouseup', (global as any).handleMouseUp);

      const downEvent = new (global.window as any).MouseEvent('mousedown');
      const upEvent = new (global.window as any).MouseEvent('mouseup');

      canvas.dispatchEvent(downEvent);
      canvas.dispatchEvent(upEvent);

      expect(mouseDownCalled).toBe(true);
      expect(mouseUpCalled).toBe(true);

      (global as any).handleMouseDown = originalHandleMouseDown;
      (global as any).handleMouseUp = originalHandleMouseUp;
    });
  });

  describe('InputSystem Integration', () => {
    it('should setup and cleanup event listeners', () => {
      const newState = new State();
      newState.registerPlugin(InputPlugin);

      const InputSystem = Array.from(newState.systems).find(
        (s) => s.group === 'simulation'
      );

      expect(InputSystem).toBeDefined();
      expect(InputSystem?.setup).toBeDefined();
      expect(InputSystem?.dispose).toBeDefined();

      InputSystem?.setup?.(newState);

      const canvas = global.document.getElementById(
        'game-canvas'
      ) as HTMLCanvasElement;
      setTargetCanvas(canvas);
      setFocusedCanvas(canvas);
      setRenderingCanvas(newState, canvas);

      const keyEvent = new (global.window as any).KeyboardEvent('keydown', {
        code: 'KeyW',
      });
      global.window.dispatchEvent(keyEvent);

      const testEntity = newState.createEntity();
      newState.addComponent(testEntity, InputState);

      InputSystem?.update?.(newState);

      expect(InputState.moveY[testEntity]).toBe(1);

      InputSystem?.dispose?.(newState);
    });

    it('should update all entities with InputState', () => {
      const entity2 = state.createEntity();
      const entity3 = state.createEntity();
      state.addComponent(entity2, InputState);
      state.addComponent(entity3, InputState);

      const keyEvent = new (global.window as any).KeyboardEvent('keydown', {
        code: 'KeyA',
      });
      global.window.dispatchEvent(keyEvent);

      const InputSystem = Array.from(state.systems).find(
        (s) => s.group === 'simulation'
      );
      InputSystem?.update?.(state);

      expect(InputState.moveX[entity]).toBe(-1);
      expect(InputState.moveX[entity2]).toBe(-1);
      expect(InputState.moveX[entity3]).toBe(-1);
    });

    it('should handle multiple keys for same action', () => {
      const wKey = new (global.window as any).KeyboardEvent('keydown', {
        code: 'KeyW',
      });
      const arrowUp = new (global.window as any).KeyboardEvent('keydown', {
        code: 'ArrowUp',
      });

      global.window.dispatchEvent(wKey);

      const InputSystem = Array.from(state.systems).find(
        (s) => s.group === 'simulation'
      );
      InputSystem?.update?.(state);

      expect(InputState.moveY[entity]).toBe(1);

      global.window.dispatchEvent(arrowUp);
      InputSystem?.update?.(state);

      expect(InputState.moveY[entity]).toBe(2);

      const wKeyUp = new (global.window as any).KeyboardEvent('keyup', {
        code: 'KeyW',
      });
      global.window.dispatchEvent(wKeyUp);
      InputSystem?.update?.(state);

      expect(InputState.moveY[entity]).toBe(1);

      const arrowUpUp = new (global.window as any).KeyboardEvent('keyup', {
        code: 'ArrowUp',
      });
      global.window.dispatchEvent(arrowUpUp);
      InputSystem?.update?.(state);

      expect(InputState.moveY[entity]).toBe(0);
    });

    it('should handle opposing movement inputs', () => {
      const forwardKey = new (global.window as any).KeyboardEvent('keydown', {
        code: 'KeyW',
      });
      const backwardKey = new (global.window as any).KeyboardEvent('keydown', {
        code: 'KeyS',
      });

      global.window.dispatchEvent(forwardKey);

      const InputSystem = Array.from(state.systems).find(
        (s) => s.group === 'simulation'
      );
      InputSystem?.update?.(state);

      expect(InputState.moveY[entity]).toBe(1);

      global.window.dispatchEvent(backwardKey);
      InputSystem?.update?.(state);

      expect(InputState.moveY[entity]).toBe(0);

      const forwardKeyUp = new (global.window as any).KeyboardEvent('keyup', {
        code: 'KeyW',
      });
      global.window.dispatchEvent(forwardKeyUp);
      InputSystem?.update?.(state);

      expect(InputState.moveY[entity]).toBe(-1);
    });
  });
});
