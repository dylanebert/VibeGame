import { Euler, Quaternion } from 'three';

export function fromEuler(x: number, y: number, z: number) {
  const euler = new Euler(x, y, z);
  const quat = new Quaternion().setFromEuler(euler);
  return { x: quat.x, y: quat.y, z: quat.z, w: quat.w };
}
