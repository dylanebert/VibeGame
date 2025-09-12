import type { Recipe } from '../../core';
import { CAMERA_TRANSFORM_DEFAULTS } from './constants';

export const cameraRecipe: Recipe = {
  name: 'camera',
  components: ['orbit-camera', 'transform', 'world-transform', 'main-camera'],
  overrides: {
    'transform.pos-y': CAMERA_TRANSFORM_DEFAULTS.posY,
    'transform.pos-z': CAMERA_TRANSFORM_DEFAULTS.posZ,
    'transform.euler-y': CAMERA_TRANSFORM_DEFAULTS.eulerY,
  },
};
