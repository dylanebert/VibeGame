import { defineQuery, type System } from '../../core';
import { InputState } from './components';
import {
  cleanupEventListeners,
  clearAllInput,
  getFocusedCanvas,
  resetFrameDeltas,
  setupEventListeners,
  updateInputState,
} from './utils';
import { getRenderingContext } from '../rendering/utils';

const inputStateQuery = defineQuery([InputState]);

export const InputSystem: System = {
  group: 'simulation',

  setup: () => {
    setupEventListeners();
    clearAllInput();
  },

  update: (state) => {
    const focusedCanvas = getFocusedCanvas();
    const context = getRenderingContext(state);

    if (!focusedCanvas || !context.canvas || context.canvas !== focusedCanvas) {
      return;
    }

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
