import type { Plugin } from '../../core';
import { InputState } from './components';
import { InputSystem } from './systems';

export const InputPlugin: Plugin = {
  systems: [InputSystem],
  components: {
    InputState,
  },
};
