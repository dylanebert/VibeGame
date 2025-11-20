import type { Plugin } from '../../core';
import { OrbitCamera } from './components';
import { orbitCameraRecipe } from './recipes';
import {
  OrbitCameraSetupSystem,
  OrbitCameraInputSystem,
  OrbitCameraSystem,
} from './systems';

export const OrbitCameraPlugin: Plugin = {
  systems: [OrbitCameraSetupSystem, OrbitCameraInputSystem, OrbitCameraSystem],
  recipes: [orbitCameraRecipe],
  components: {
    OrbitCamera,
  },
  config: {
    defaults: {
      'orbit-camera': {
        target: 0,
        inputSource: 0,
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
        sensitivity: 0.007,
        zoomSensitivity: 1.5,
      },
    },
  },
};
