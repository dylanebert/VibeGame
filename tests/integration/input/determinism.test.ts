import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import {
  getGlobalInputBuffer,
  InputButtons,
  InputState,
  setTargetCanvas,
  State,
  TIME_CONSTANTS,
} from 'vibegame';
import type { InputCommand } from '../../../src/plugins/input/utils';
import {
  Body,
  CharacterController,
  CharacterMovement,
  initializePhysics,
  PhysicsPlugin,
} from '../../../src/plugins/physics';
import { Player } from '../../../src/plugins/player';
import { Transform } from '../../../src/plugins/transforms';

describe('Input Determinism', () => {
  let dom: JSDOM;

  beforeAll(async () => {
    await initializePhysics();
  });

  beforeEach(() => {
    dom = new JSDOM(
      '<!DOCTYPE html><html><body><canvas id="test-canvas"></canvas></body></html>'
    );
    global.window = dom.window as any;
    global.document = dom.window.document;
    global.performance = { now: () => Date.now() } as any;
  });

  function createTestState(): State {
    const state = new State();
    state.registerPlugin(PhysicsPlugin);

    const canvas = global.document.getElementById(
      'test-canvas'
    ) as HTMLCanvasElement;
    setTargetCanvas(canvas);

    const systems = Array.from(state.systems);
    for (const system of systems) {
      system.setup?.(state);
    }

    return state;
  }

  function createPlayer(state: State): number {
    const player = state.createEntity();
    state.addComponent(player, Transform);
    state.addComponent(player, Body, {
      posX: 0,
      posY: 10,
      posZ: 0,
    });
    state.addComponent(player, CharacterMovement);
    state.addComponent(player, CharacterController);
    state.addComponent(player, InputState);
    state.addComponent(player, Player);

    return player;
  }

  function applyInputCommand(
    _state: State,
    eid: number,
    command: InputCommand
  ): void {
    InputState.tick[eid] = command.tick;
    InputState.buttons[eid] = command.buttons;
    InputState.moveX[eid] = command.moveX;
    InputState.moveY[eid] = command.moveY;
    InputState.lookDeltaX[eid] = command.lookDeltaX;
    InputState.lookDeltaY[eid] = command.lookDeltaY;
    InputState.scrollDelta[eid] = command.scrollDelta;
  }

  it('should produce identical physics state when replaying inputs', () => {
    const state1 = createTestState();
    const state2 = createTestState();

    const player1 = createPlayer(state1);
    const player2 = createPlayer(state2);

    const recording: InputCommand[] = [];

    for (let frame = 0; frame < 120; frame++) {
      const command: InputCommand = {
        tick: state1.time.tick,
        buttons: frame === 30 ? InputButtons.JUMP : 0,
        moveX: frame < 60 ? 1 : 0,
        moveY: 0,
        lookDeltaX: 0,
        lookDeltaY: 0,
        scrollDelta: 0,
      };

      applyInputCommand(state1, player1, command);
      recording.push(command);

      state1.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    for (let frame = 0; frame < 120; frame++) {
      applyInputCommand(state2, player2, recording[frame]);
      state2.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posX[player2]).toBe(Body.posX[player1]);
    expect(Body.posY[player2]).toBe(Body.posY[player1]);
    expect(Body.posZ[player2]).toBe(Body.posZ[player1]);

    expect(Body.velX[player2]).toBe(Body.velX[player1]);
    expect(Body.velY[player2]).toBe(Body.velY[player1]);
    expect(Body.velZ[player2]).toBe(Body.velZ[player1]);

    expect(Transform.posX[player2]).toBe(Transform.posX[player1]);
    expect(Transform.posY[player2]).toBe(Transform.posY[player1]);
    expect(Transform.posZ[player2]).toBe(Transform.posZ[player1]);
  });

  it('should record and replay inputs through InputBuffer', () => {
    const state = createTestState();
    const player = createPlayer(state);

    const buffer = getGlobalInputBuffer();
    buffer.clear();

    for (let frame = 0; frame < 60; frame++) {
      const command: InputCommand = {
        tick: state.time.tick,
        buttons: frame === 15 ? InputButtons.JUMP : 0,
        moveX: 1,
        moveY: 0,
        lookDeltaX: 0,
        lookDeltaY: 0,
        scrollDelta: 0,
      };

      buffer.set(state.time.tick, command);
      applyInputCommand(state, player, command);
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    const recording = buffer.getRange(0, 59);

    expect(recording.length).toBe(60);

    const state2 = createTestState();
    const player2 = createPlayer(state2);

    for (const command of recording) {
      applyInputCommand(state2, player2, command);
      state2.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posX[player2]).toBe(Body.posX[player]);
    expect(Body.posY[player2]).toBe(Body.posY[player]);
    expect(Body.posZ[player2]).toBe(Body.posZ[player]);
  });

  it('should maintain determinism across different tick sequences', () => {
    const state1 = createTestState();
    const state2 = createTestState();

    const player1 = createPlayer(state1);
    const player2 = createPlayer(state2);

    const inputSequence: InputCommand[] = [
      {
        tick: 0,
        buttons: 0,
        moveX: 1,
        moveY: 0,
        lookDeltaX: 0,
        lookDeltaY: 0,
        scrollDelta: 0,
      },
      {
        tick: 1,
        buttons: 0,
        moveX: 1,
        moveY: 0,
        lookDeltaX: 0,
        lookDeltaY: 0,
        scrollDelta: 0,
      },
      {
        tick: 2,
        buttons: InputButtons.JUMP,
        moveX: 1,
        moveY: 0,
        lookDeltaX: 0,
        lookDeltaY: 0,
        scrollDelta: 0,
      },
      {
        tick: 3,
        buttons: 0,
        moveX: 1,
        moveY: 0,
        lookDeltaX: 0,
        lookDeltaY: 0,
        scrollDelta: 0,
      },
      {
        tick: 4,
        buttons: 0,
        moveX: 0,
        moveY: 0,
        lookDeltaX: 0,
        lookDeltaY: 0,
        scrollDelta: 0,
      },
    ];

    for (const command of inputSequence) {
      applyInputCommand(state1, player1, command);
      state1.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    for (const command of inputSequence) {
      applyInputCommand(state2, player2, command);
      state2.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }

    expect(Body.posX[player2]).toBe(Body.posX[player1]);
    expect(Body.posY[player2]).toBe(Body.posY[player1]);
    expect(Body.posZ[player2]).toBe(Body.posZ[player1]);
    expect(Body.velX[player2]).toBe(Body.velX[player1]);
    expect(Body.velY[player2]).toBe(Body.velY[player1]);
    expect(Body.velZ[player2]).toBe(Body.velZ[player1]);
  });

  it('should have tick counter increment deterministically', () => {
    const state = createTestState();

    expect(state.time.tick).toBe(0);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    expect(state.time.tick).toBe(1);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    expect(state.time.tick).toBe(2);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP / 2);
    expect(state.time.tick).toBe(2);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    expect(state.time.tick).toBe(3);
  });

  it('should handle button bitmasks correctly', () => {
    const command: InputCommand = {
      tick: 0,
      buttons:
        InputButtons.JUMP | InputButtons.PRIMARY | InputButtons.MOVE_FORWARD,
      moveX: 0,
      moveY: 0,
      lookDeltaX: 0,
      lookDeltaY: 0,
      scrollDelta: 0,
    };

    expect(command.buttons & InputButtons.JUMP).toBeTruthy();
    expect(command.buttons & InputButtons.PRIMARY).toBeTruthy();
    expect(command.buttons & InputButtons.MOVE_FORWARD).toBeTruthy();
    expect(command.buttons & InputButtons.SECONDARY).toBe(0);
    expect(command.buttons & InputButtons.MOVE_BACKWARD).toBe(0);
  });
});
