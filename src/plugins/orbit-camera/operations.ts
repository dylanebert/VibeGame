import { Transform, syncEulerFromQuaternion } from '../transforms';
import * as THREE from 'three';
import { OrbitCamera } from './components';
import { normalizeAngle, shortestAngleDiff, smoothLerp } from './math';

export function smoothCameraRotation(
  cameraEntity: number,
  deltaTime: number
): void {
  const lerpFactor = smoothLerp(
    OrbitCamera.smoothness[cameraEntity],
    deltaTime
  );

  const yawDiff = shortestAngleDiff(
    OrbitCamera.currentYaw[cameraEntity],
    OrbitCamera.targetYaw[cameraEntity]
  );
  OrbitCamera.currentYaw[cameraEntity] += yawDiff * lerpFactor;
  OrbitCamera.currentYaw[cameraEntity] = normalizeAngle(
    OrbitCamera.currentYaw[cameraEntity]
  );

  OrbitCamera.currentPitch[cameraEntity] +=
    (OrbitCamera.targetPitch[cameraEntity] -
      OrbitCamera.currentPitch[cameraEntity]) *
    lerpFactor;

  OrbitCamera.currentDistance[cameraEntity] +=
    (OrbitCamera.targetDistance[cameraEntity] -
      OrbitCamera.currentDistance[cameraEntity]) *
    lerpFactor;
}

export function calculateCameraPosition(
  cameraEntity: number,
  targetPosition: THREE.Vector3
): THREE.Vector3 {
  const distance = OrbitCamera.currentDistance[cameraEntity];
  const yawAngle = OrbitCamera.currentYaw[cameraEntity];
  const polarAngle = Math.PI / 2 - OrbitCamera.currentPitch[cameraEntity];

  const spherical = new THREE.Spherical(distance, polarAngle, yawAngle);
  const cameraPosition = new THREE.Vector3()
    .setFromSpherical(spherical)
    .add(targetPosition);

  return cameraPosition;
}

export function updateCameraTransform(
  cameraEntity: number,
  cameraPosition: THREE.Vector3,
  targetPosition: THREE.Vector3
): void {
  Transform.posX[cameraEntity] = cameraPosition.x;
  Transform.posY[cameraEntity] = cameraPosition.y;
  Transform.posZ[cameraEntity] = cameraPosition.z;

  const tempMatrix = new THREE.Matrix4();
  tempMatrix.lookAt(cameraPosition, targetPosition, new THREE.Vector3(0, 1, 0));
  const tempQuaternion = new THREE.Quaternion().setFromRotationMatrix(
    tempMatrix
  );

  Transform.rotX[cameraEntity] = tempQuaternion.x;
  Transform.rotY[cameraEntity] = tempQuaternion.y;
  Transform.rotZ[cameraEntity] = tempQuaternion.z;
  Transform.rotW[cameraEntity] = tempQuaternion.w;

  syncEulerFromQuaternion(Transform, cameraEntity);
}
