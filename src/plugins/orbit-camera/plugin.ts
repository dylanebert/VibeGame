import type { Plugin } from '../../core';
import { OrbitCamera } from './components';
import { ORBIT_CAMERA_DEFAULTS } from './constants';
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
        target: ORBIT_CAMERA_DEFAULTS.target,
        currentDistance: ORBIT_CAMERA_DEFAULTS.currentDistance,
        targetDistance: ORBIT_CAMERA_DEFAULTS.targetDistance,
        currentYaw: ORBIT_CAMERA_DEFAULTS.currentYaw,
        targetYaw: ORBIT_CAMERA_DEFAULTS.targetYaw,
        currentPitch: ORBIT_CAMERA_DEFAULTS.currentPitch,
        targetPitch: ORBIT_CAMERA_DEFAULTS.targetPitch,
        minDistance: ORBIT_CAMERA_DEFAULTS.minDistance,
        maxDistance: ORBIT_CAMERA_DEFAULTS.maxDistance,
        minPitch: ORBIT_CAMERA_DEFAULTS.minPitch,
        maxPitch: ORBIT_CAMERA_DEFAULTS.maxPitch,
        smoothness: ORBIT_CAMERA_DEFAULTS.smoothness,
        offsetX: ORBIT_CAMERA_DEFAULTS.offsetX,
        offsetY: ORBIT_CAMERA_DEFAULTS.offsetY,
        offsetZ: ORBIT_CAMERA_DEFAULTS.offsetZ,
      },
    },
  },
};
