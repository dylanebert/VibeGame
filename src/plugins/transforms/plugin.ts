import type { Plugin } from '../../core';
import { Transform, WorldTransform } from './components';
import { TransformHierarchySystem } from './systems';

export const TransformsPlugin: Plugin = {
  systems: [TransformHierarchySystem],
  components: {
    Transform,
    WorldTransform,
  },
  config: {
    defaults: {
      transform: {
        rotW: 1,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
      },
      'world-transform': {
        rotW: 1,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
      },
    },
    validations: [
      {
        condition: (_recipeName, attributes) => 'world-transform' in attributes,
        warning:
          '"world-transform" is read-only.\n  Use "transform" for local transforms, or "body" for physics objects',
      },
    ],
  },
};
