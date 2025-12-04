import type { Plugin } from '../../core';
import { Line } from './components';
import { LineSystem } from './systems';

export const LinePlugin: Plugin = {
  systems: [LineSystem],
  components: {
    Line,
  },
  config: {
    defaults: {
      line: {
        offsetX: 1,
        offsetY: 0,
        offsetZ: 0,
        color: 0xffffff,
        thickness: 2,
        opacity: 1,
        visible: 1,
        arrowStart: 0,
        arrowEnd: 0,
        arrowSize: 0.2,
      },
    },
  },
};
