import * as THREE from 'three';
import { Transform, WorldTransform } from './components';

type TransformComponent = typeof Transform | typeof WorldTransform;

export function eulerToQuaternion(
  x: number,
  y: number,
  z: number
): { x: number; y: number; z: number; w: number } {
  const radX = x * (Math.PI / 180);
  const radY = y * (Math.PI / 180);
  const radZ = z * (Math.PI / 180);

  const c1 = Math.cos(radX / 2);
  const c2 = Math.cos(radY / 2);
  const c3 = Math.cos(radZ / 2);
  const s1 = Math.sin(radX / 2);
  const s2 = Math.sin(radY / 2);
  const s3 = Math.sin(radZ / 2);

  return {
    x: s1 * c2 * c3 + c1 * s2 * s3,
    y: c1 * s2 * c3 - s1 * c2 * s3,
    z: c1 * c2 * s3 + s1 * s2 * c3,
    w: c1 * c2 * c3 - s1 * s2 * s3,
  };
}

export function quaternionToEuler(
  x: number,
  y: number,
  z: number,
  w: number
): { x: number; y: number; z: number } {
  const euler = new THREE.Euler();
  const quat = new THREE.Quaternion(x, y, z, w);
  euler.setFromQuaternion(quat, 'XYZ');

  return {
    x: euler.x * (180 / Math.PI),
    y: euler.y * (180 / Math.PI),
    z: euler.z * (180 / Math.PI),
  };
}

export function syncEulerFromQuaternion(
  transform: TransformComponent,
  entity: number
): void {
  const euler = quaternionToEuler(
    transform.rotX[entity],
    transform.rotY[entity],
    transform.rotZ[entity],
    transform.rotW[entity]
  );
  transform.eulerX[entity] = euler.x;
  transform.eulerY[entity] = euler.y;
  transform.eulerZ[entity] = euler.z;
}

export function syncQuaternionFromEuler(
  transform: TransformComponent,
  entity: number
): void {
  const quat = eulerToQuaternion(
    transform.eulerX[entity],
    transform.eulerY[entity],
    transform.eulerZ[entity]
  );
  transform.rotX[entity] = quat.x;
  transform.rotY[entity] = quat.y;
  transform.rotZ[entity] = quat.z;
  transform.rotW[entity] = quat.w;
}

export function copyTransform(
  from: TransformComponent,
  to: TransformComponent,
  entity: number
): void {
  to.posX[entity] = from.posX[entity];
  to.posY[entity] = from.posY[entity];
  to.posZ[entity] = from.posZ[entity];
  to.rotX[entity] = from.rotX[entity];
  to.rotY[entity] = from.rotY[entity];
  to.rotZ[entity] = from.rotZ[entity];
  to.rotW[entity] = from.rotW[entity];
  to.eulerX[entity] = from.eulerX[entity];
  to.eulerY[entity] = from.eulerY[entity];
  to.eulerZ[entity] = from.eulerZ[entity];
  to.scaleX[entity] = from.scaleX[entity];
  to.scaleY[entity] = from.scaleY[entity];
  to.scaleZ[entity] = from.scaleZ[entity];
}

export function setTransformIdentity(
  transform: TransformComponent,
  entity: number
): void {
  transform.posX[entity] = 0;
  transform.posY[entity] = 0;
  transform.posZ[entity] = 0;
  transform.rotX[entity] = 0;
  transform.rotY[entity] = 0;
  transform.rotZ[entity] = 0;
  transform.rotW[entity] = 1;
  transform.eulerX[entity] = 0;
  transform.eulerY[entity] = 0;
  transform.eulerZ[entity] = 0;
  transform.scaleX[entity] = 1;
  transform.scaleY[entity] = 1;
  transform.scaleZ[entity] = 1;
}

export function composeTransformMatrix(
  transform: TransformComponent,
  entity: number,
  matrix: THREE.Matrix4,
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
  scale: THREE.Vector3
): void {
  position.set(
    transform.posX[entity],
    transform.posY[entity],
    transform.posZ[entity]
  );
  rotation.set(
    transform.rotX[entity],
    transform.rotY[entity],
    transform.rotZ[entity],
    transform.rotW[entity]
  );
  scale.set(
    transform.scaleX[entity],
    transform.scaleY[entity],
    transform.scaleZ[entity]
  );
  matrix.compose(position, rotation, scale);
}

export function decomposeTransformMatrix(
  matrix: THREE.Matrix4,
  transform: TransformComponent,
  entity: number,
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
  scale: THREE.Vector3
): void {
  matrix.decompose(position, rotation, scale);
  transform.posX[entity] = position.x;
  transform.posY[entity] = position.y;
  transform.posZ[entity] = position.z;
  transform.rotX[entity] = rotation.x;
  transform.rotY[entity] = rotation.y;
  transform.rotZ[entity] = rotation.z;
  transform.rotW[entity] = rotation.w;
  syncEulerFromQuaternion(transform, entity);
  transform.scaleX[entity] = scale.x;
  transform.scaleY[entity] = scale.y;
  transform.scaleZ[entity] = scale.z;
}
