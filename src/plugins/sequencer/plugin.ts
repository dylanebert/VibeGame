import type { Plugin } from '../../core';
import {
  PositionModifier,
  RotationModifier,
  ScaleModifier,
  SequencedTransform,
} from './components';
import { ApplySequencedTransformsSystem } from './systems';

export const SequencerPlugin: Plugin = {
  systems: [ApplySequencedTransformsSystem],
  components: {
    SequencedTransform,
    PositionModifier,
    RotationModifier,
    ScaleModifier,
  },
  config: {
    defaults: {
      'sequenced-transform': {
        posX: 0,
        posY: 0,
        posZ: 0,
        eulerX: 0,
        eulerY: 0,
        eulerZ: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
      },
    },
  },
};
