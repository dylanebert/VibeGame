import { defineQuery, type System } from '../../core';
import { InputState } from './components';
import {
  cleanupEventListeners,
  clearAllInput,
  resetFrameDeltas,
  setupEventListeners,
  updateInputState,
} from './utils';

// Query definitions
const inputStateQuery = defineQuery([InputState]);

export const InputSystem: System = {
  group: 'simulation',

  setup: () => {
    setupEventListeners();
    clearAllInput();
  },

  update: (state) => {
    const entities = inputStateQuery(state.world);

    for (const eid of entities) {
      updateInputState(eid);
    }

    resetFrameDeltas();
  },

  dispose: () => {
    cleanupEventListeners();
    clearAllInput();
  },
};
