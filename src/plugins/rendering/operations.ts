import type { State } from '../../core';
import { defineQuery } from '../../core';
import * as THREE from 'three';
import { WorldTransform } from '../transforms';
import { MainCamera, Renderer } from './components';
import {
  findAvailableInstanceSlot,
  initializeInstancedMesh,
  SHADOW_CONFIG,
  type RenderingContext,
} from './utils';

const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const rotation = new THREE.Quaternion();
const scale = new THREE.Vector3();

const mainCameraTransformQuery = defineQuery([MainCamera, WorldTransform]);

export function getOrCreateMesh(
  context: RenderingContext,
  shapeId: number
): THREE.InstancedMesh | null {
  let mesh = context.meshPools.get(shapeId);

  if (!mesh) {
    const geometry = context.geometries.get(shapeId);
    if (!geometry) return null;

    mesh = initializeInstancedMesh(geometry, context.material);
    context.meshPools.set(shapeId, mesh);
    context.scene.add(mesh);
  }

  return mesh;
}

export function updateInstance(
  mesh: THREE.InstancedMesh,
  entity: number,
  context: RenderingContext,
  state: State
): void {
  let instanceInfo = context.entityInstances.get(entity);

  if (!instanceInfo) {
    const instanceId = findAvailableInstanceSlot(mesh, matrix);
    if (instanceId === null) return;

    instanceInfo = { poolId: Renderer.shape[entity], instanceId };
    context.entityInstances.set(entity, instanceInfo);
  }

  if (state.hasComponent(entity, WorldTransform)) {
    position.set(
      WorldTransform.posX[entity],
      WorldTransform.posY[entity],
      WorldTransform.posZ[entity]
    );
    rotation.set(
      WorldTransform.rotX[entity],
      WorldTransform.rotY[entity],
      WorldTransform.rotZ[entity],
      WorldTransform.rotW[entity]
    );
    scale.set(
      WorldTransform.scaleX[entity],
      WorldTransform.scaleY[entity],
      WorldTransform.scaleZ[entity]
    );

    scale.x *= Renderer.sizeX[entity];
    scale.y *= Renderer.sizeY[entity];
    scale.z *= Renderer.sizeZ[entity];

    matrix.compose(position, rotation, scale);
    mesh.setMatrixAt(instanceInfo.instanceId, matrix);
    mesh.instanceMatrix.needsUpdate = true;

    const color = new THREE.Color(Renderer.color[entity]);
    mesh.setColorAt(instanceInfo.instanceId, color);
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }
}

export function hideInstance(
  mesh: THREE.InstancedMesh,
  entity: number,
  context: RenderingContext
): void {
  const instanceInfo = context.entityInstances.get(entity);
  if (instanceInfo) {
    const zeroMatrix = new THREE.Matrix4();
    zeroMatrix.makeScale(0, 0, 0);
    mesh.setMatrixAt(instanceInfo.instanceId, zeroMatrix);
    mesh.instanceMatrix.needsUpdate = true;
  }
}

export function updateShadowCamera(
  context: RenderingContext,
  state: State
): void {
  const cameraTargets = mainCameraTransformQuery(state.world);
  let activeTarget: number | null = null;

  for (const entity of cameraTargets) {
    activeTarget = entity;
    break;
  }

  if (activeTarget === null) return;

  const directional = context.lights.directional;
  if (!directional) return;

  const targetPosition = new THREE.Vector3(
    WorldTransform.posX[activeTarget],
    WorldTransform.posY[activeTarget],
    WorldTransform.posZ[activeTarget]
  );

  const shadowCamera = directional.shadow.camera as THREE.OrthographicCamera;

  const lightPosition = targetPosition
    .clone()
    .add(
      SHADOW_CONFIG.LIGHT_DIRECTION.clone().multiplyScalar(
        SHADOW_CONFIG.LIGHT_DISTANCE
      )
    );

  directional.position.copy(lightPosition);
  directional.target.position.copy(targetPosition);
  directional.target.updateMatrixWorld();

  const radius = SHADOW_CONFIG.CAMERA_RADIUS;
  shadowCamera.left = -radius;
  shadowCamera.right = radius;
  shadowCamera.top = radius;
  shadowCamera.bottom = -radius;
  shadowCamera.near = SHADOW_CONFIG.NEAR_PLANE;
  shadowCamera.far = SHADOW_CONFIG.FAR_PLANE;
  shadowCamera.position.copy(lightPosition);
  shadowCamera.lookAt(targetPosition);
  shadowCamera.updateProjectionMatrix();
  shadowCamera.updateMatrixWorld();
}
