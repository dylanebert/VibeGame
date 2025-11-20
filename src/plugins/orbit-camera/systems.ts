import { defineQuery, type System } from '../../core';
import { Transform, WorldTransform } from '../transforms';
import * as THREE from 'three';
import { OrbitCamera } from './components';
import { InputState } from '../input';
import {
  calculateCameraPosition,
  smoothCameraRotation,
  updateCameraTransform,
} from './operations';

const orbitCameraQuery = defineQuery([OrbitCamera, Transform]);
const orbitCameraInputQuery = defineQuery([OrbitCamera]);

export const OrbitCameraInputSystem: System = {
  group: 'simulation',
  update: (state) => {
    const cameraEntities = orbitCameraInputQuery(state.world);

    for (const entity of cameraEntities) {
      let inputSource = OrbitCamera.inputSource[entity];

      if (!inputSource && state.hasComponent(entity, InputState)) {
        inputSource = entity;
        OrbitCamera.inputSource[entity] = entity;
      }

      if (!inputSource || !state.hasComponent(inputSource, InputState)) {
        continue;
      }

      const sensitivity = OrbitCamera.sensitivity[entity];
      const zoomSensitivity = OrbitCamera.zoomSensitivity[entity];
      const lookX = InputState.lookX[inputSource];
      const lookY = InputState.lookY[inputSource];
      const scrollDelta = InputState.scrollDelta[inputSource];
      const rightMouseHeld = InputState.rightMouse[inputSource] === 1;

      if (rightMouseHeld) {
        OrbitCamera.targetYaw[entity] -= lookX * sensitivity;

        const currentPitch = OrbitCamera.targetPitch[entity];
        const newPitch = currentPitch + lookY * sensitivity;
        const minPitch = OrbitCamera.minPitch[entity];
        const maxPitch = OrbitCamera.maxPitch[entity];

        OrbitCamera.targetPitch[entity] = Math.max(
          minPitch,
          Math.min(maxPitch, newPitch)
        );
      }

      if (scrollDelta !== 0) {
        const currentDistance = OrbitCamera.targetDistance[entity];
        const minDistance = OrbitCamera.minDistance[entity];
        const maxDistance = OrbitCamera.maxDistance[entity];

        const distanceScale = Math.max(0.3, currentDistance * 0.08);
        const zoomDelta = scrollDelta * zoomSensitivity * distanceScale;
        const newDistance = currentDistance + zoomDelta;

        OrbitCamera.targetDistance[entity] = Math.max(
          minDistance,
          Math.min(maxDistance, newDistance)
        );
      }
    }
  },
};

export const OrbitCameraSystem: System = {
  group: 'draw',
  update: (state) => {
    const cameraEntities = orbitCameraQuery(state.world);

    for (const cameraEntity of cameraEntities) {
      const targetEntity = OrbitCamera.target[cameraEntity];
      if (!targetEntity || !state.hasComponent(targetEntity, WorldTransform)) {
        continue;
      }

      smoothCameraRotation(cameraEntity, state.time.deltaTime);

      const targetPosition = new THREE.Vector3(
        WorldTransform.posX[targetEntity] + OrbitCamera.offsetX[cameraEntity],
        WorldTransform.posY[targetEntity] + OrbitCamera.offsetY[cameraEntity],
        WorldTransform.posZ[targetEntity] + OrbitCamera.offsetZ[cameraEntity]
      );

      const cameraPosition = calculateCameraPosition(
        cameraEntity,
        targetPosition
      );
      updateCameraTransform(cameraEntity, cameraPosition, targetPosition);
    }
  },
};
