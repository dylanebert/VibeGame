import type { Plugin } from 'vibegame';
import { BreatheDriver } from './components';
import { BreatheDriverApplySystem, BreatheDriverRestoreSystem } from './systems';

export const VisualizationPlugin: Plugin = {
  components: { BreatheDriver },
  systems: [BreatheDriverApplySystem, BreatheDriverRestoreSystem],
  config: {
    defaults: {
      'breathe-driver': {
        intensity: 0,
        speed: 2,
        amplitude: 0.2,
      },
    },
  },
};
