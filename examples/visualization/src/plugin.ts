import type { Plugin } from 'vibegame';
import { BreatheDriver, Breathe } from './components';
import { BreatheSystem } from './systems';

export const VisualizationPlugin: Plugin = {
  components: { BreatheDriver, Breathe },
  systems: [BreatheSystem],
  config: {
    defaults: {
      'breathe-driver': {
        value: 0,
      },
    },
  },
};
