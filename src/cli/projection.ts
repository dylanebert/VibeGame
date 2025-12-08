import { Matrix4, Quaternion, Vector3 } from 'three';
import { defineQuery } from 'bitecs';
import type { State, ScreenCoordinate } from '../core';
import { MainCamera } from '../plugins/rendering/components';
import { CameraProjection } from '../plugins/rendering/utils';
import { WorldTransform } from '../plugins/transforms/components';

export type { ScreenCoordinate };

export interface ViewportConfig {
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const NEAR = 0.1;
const FAR = 1000;

const cameraQuery = defineQuery([MainCamera, WorldTransform]);

const position = new Vector3();
const quaternion = new Quaternion();
const scale = new Vector3(1, 1, 1);
const worldMatrix = new Matrix4();
const viewMatrix = new Matrix4();
const projectionMatrix = new Matrix4();
const entityPos = new Vector3();

export function projectToScreen(
  state: State,
  entityId: number,
  viewport?: ViewportConfig
): ScreenCoordinate | null {
  const worldTransform = state.getComponent('world-transform');
  if (!worldTransform || !state.hasComponent(entityId, worldTransform)) {
    return null;
  }

  const cameras = cameraQuery(state.world);
  if (cameras.length === 0) return null;

  const cameraEid = cameras[0];
  const width = viewport?.width ?? DEFAULT_WIDTH;
  const height = viewport?.height ?? DEFAULT_HEIGHT;
  const aspect = width / height;

  position.set(
    WorldTransform.posX[cameraEid],
    WorldTransform.posY[cameraEid],
    WorldTransform.posZ[cameraEid]
  );
  quaternion.set(
    WorldTransform.rotX[cameraEid],
    WorldTransform.rotY[cameraEid],
    WorldTransform.rotZ[cameraEid],
    WorldTransform.rotW[cameraEid]
  );
  worldMatrix.compose(position, quaternion, scale);

  viewMatrix.copy(worldMatrix).invert();

  const projType = MainCamera.projection[cameraEid];
  const fov = MainCamera.fov[cameraEid] || 75;
  const orthoSize = MainCamera.orthoSize[cameraEid] || 10;

  if (projType === CameraProjection.ORTHOGRAPHIC) {
    const halfHeight = orthoSize / 2;
    const halfWidth = halfHeight * aspect;
    projectionMatrix.makeOrthographic(
      -halfWidth,
      halfWidth,
      halfHeight,
      -halfHeight,
      NEAR,
      FAR
    );
  } else {
    const fovRad = (fov * Math.PI) / 180;
    projectionMatrix.makePerspective(
      -NEAR * Math.tan(fovRad / 2) * aspect,
      NEAR * Math.tan(fovRad / 2) * aspect,
      NEAR * Math.tan(fovRad / 2),
      -NEAR * Math.tan(fovRad / 2),
      NEAR,
      FAR
    );
  }

  entityPos.set(
    WorldTransform.posX[entityId],
    WorldTransform.posY[entityId],
    WorldTransform.posZ[entityId]
  );

  entityPos.applyMatrix4(viewMatrix);
  entityPos.applyMatrix4(projectionMatrix);

  const screenX = ((entityPos.x + 1) / 2) * width;
  const screenY = ((1 - entityPos.y) / 2) * height;

  return {
    x: screenX,
    y: screenY,
    z: entityPos.z,
    visible: entityPos.z >= -1 && entityPos.z <= 1,
  };
}

export function createProjector(
  state: State,
  viewport?: ViewportConfig
): (eid: number) => ScreenCoordinate | null {
  return (eid) => projectToScreen(state, eid, viewport);
}
