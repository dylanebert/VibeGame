import type { Plugin } from '../../core';
import { NetworkConnectionSystem } from './systems';

export const NetworkingPlugin: Plugin = {
  systems: [NetworkConnectionSystem],
  components: {},
};
