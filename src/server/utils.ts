export interface PositionSnapshot {
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  rotW: number;
}

export function sanitizeNumber(value: number): number {
  if (!isFinite(value) || isNaN(value)) return 0;
  return value;
}

export function normalizeQuaternion(quat: {
  x: number;
  y: number;
  z: number;
  w: number;
}): { x: number; y: number; z: number; w: number } {
  const mag = Math.sqrt(
    quat.x * quat.x + quat.y * quat.y + quat.z * quat.z + quat.w * quat.w
  );

  if (mag < 0.001) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  return {
    x: quat.x / mag,
    y: quat.y / mag,
    z: quat.z / mag,
    w: quat.w / mag,
  };
}

export function isValidSnapshot(snapshot: PositionSnapshot): boolean {
  const MAX_POS = 1000;

  if (
    !isFinite(snapshot.posX) ||
    !isFinite(snapshot.posY) ||
    !isFinite(snapshot.posZ)
  ) {
    return false;
  }

  if (
    Math.abs(snapshot.posX) > MAX_POS ||
    Math.abs(snapshot.posY) > MAX_POS ||
    Math.abs(snapshot.posZ) > MAX_POS
  ) {
    return false;
  }

  if (
    !isFinite(snapshot.rotX) ||
    !isFinite(snapshot.rotY) ||
    !isFinite(snapshot.rotZ) ||
    !isFinite(snapshot.rotW)
  ) {
    return false;
  }

  return true;
}
