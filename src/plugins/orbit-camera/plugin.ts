import type { Plugin } from '../../core';
import { OrbitCamera } from './components';
import { cameraRecipe } from './recipes';
import { OrbitCameraSystem } from './systems';

export const OrbitCameraPlugin: Plugin = {
  systems: [OrbitCameraSystem],
  recipes: [cameraRecipe],
  components: {
    OrbitCamera,
  },
  config: {
    defaults: {
      'orbit-camera': {
        target: 0,
        currentDistance: 4,
        targetDistance: 4,
        currentYaw: 0,
        targetYaw: 0,
        currentPitch: Math.PI / 6,
        targetPitch: Math.PI / 6,
        minDistance: 1,
        maxDistance: 25,
        minPitch: 0,
        maxPitch: Math.PI / 2,
        smoothness: 0.5,
        offsetX: 0,
        offsetY: 1.25,
        offsetZ: 0,
      },
    },
  },
};
