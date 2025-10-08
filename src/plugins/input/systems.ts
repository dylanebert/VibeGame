import { defineQuery, type System } from '../../core';
import { InputState } from './components';
import { INPUT_CONFIG } from './config';
import {
  InputBuffer,
  sampleInput,
  resetFrameDeltas,
  setupEventListeners,
  cleanupEventListeners,
  clearRawInput,
} from './utils';

const inputStateQuery = defineQuery([InputState]);

const globalInputBuffer = new InputBuffer();

export function getGlobalInputBuffer(): InputBuffer {
  return globalInputBuffer;
}

export const InputSystem: System = {
  group: 'simulation',

  setup: () => {
    setupEventListeners();
    clearRawInput();
  },

  update: (state) => {
    const entities = inputStateQuery(state.world);
    const currentTick = state.time.tick;

    const command = sampleInput(
      currentTick,
      {
        moveForward: INPUT_CONFIG.mappings.moveForward,
        moveBackward: INPUT_CONFIG.mappings.moveBackward,
        moveLeft: INPUT_CONFIG.mappings.moveLeft,
        moveRight: INPUT_CONFIG.mappings.moveRight,
        moveUp: INPUT_CONFIG.mappings.moveUp,
        moveDown: INPUT_CONFIG.mappings.moveDown,
        jump: INPUT_CONFIG.mappings.jump,
      },
      INPUT_CONFIG.mouseSensitivity.look
    );

    globalInputBuffer.set(currentTick, command);

    for (const eid of entities) {
      InputState.tick[eid] = command.tick;
      InputState.buttons[eid] = command.buttons;
      InputState.moveX[eid] = command.moveX;
      InputState.moveY[eid] = command.moveY;
      InputState.lookDeltaX[eid] = command.lookDeltaX;
      InputState.lookDeltaY[eid] = command.lookDeltaY;
      InputState.scrollDelta[eid] = command.scrollDelta;
    }

    resetFrameDeltas();
  },

  dispose: () => {
    cleanupEventListeners();
    clearRawInput();
    globalInputBuffer.clear();
  },
};
