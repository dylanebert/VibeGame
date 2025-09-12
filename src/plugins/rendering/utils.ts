import type { State } from '../../core';
import * as THREE from 'three';

const MAX_INSTANCES = 1000;
const DEFAULT_COLOR = 0xffffff;

const RendererShape = {
  BOX: 0,
  SPHERE: 1,
  CYLINDER: 2,
  PLANE: 3,
} as const;

export const threeCameras = new Map<number, THREE.PerspectiveCamera>();
const canvasElements = new Map<number, HTMLCanvasElement>();

function createThreeCamera(entity: number): THREE.PerspectiveCamera {
  const aspectRatio =
    typeof window !== 'undefined'
      ? window.innerWidth / window.innerHeight
      : 16 / 9;
  const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
  threeCameras.set(entity, camera);
  return camera;
}

export { createThreeCamera };

export function findAvailableInstanceSlot(
  mesh: THREE.InstancedMesh,
  matrix: THREE.Matrix4
): number | null {
  for (let i = 0; i < MAX_INSTANCES; i++) {
    mesh.getMatrixAt(i, matrix);
    if (
      matrix.elements[0] === 0 &&
      matrix.elements[5] === 0 &&
      matrix.elements[10] === 0
    ) {
      return i;
    }
  }
  return null;
}

export function initializeInstancedMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, MAX_INSTANCES);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  const zeroMatrix = new THREE.Matrix4();
  zeroMatrix.makeScale(0, 0, 0);
  const defaultColor = new THREE.Color(DEFAULT_COLOR);

  for (let i = 0; i < MAX_INSTANCES; i++) {
    mesh.setMatrixAt(i, zeroMatrix);
    mesh.setColorAt(i, defaultColor);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }

  return mesh;
}

export interface RenderingContext {
  scene: THREE.Scene;
  meshPools: Map<number, THREE.InstancedMesh>;
  geometries: Map<number, THREE.BufferGeometry>;
  material: THREE.MeshStandardMaterial;
  entityInstances: Map<number, { poolId: number; instanceId: number }>;
  lights: {
    ambient: THREE.HemisphereLight;
    directional: THREE.DirectionalLight;
  };
  renderer?: THREE.WebGLRenderer;
  canvas?: HTMLCanvasElement;
}

const stateToRenderingContext = new WeakMap<State, RenderingContext>();

export function createGeometries(): Map<number, THREE.BufferGeometry> {
  const geometries = new Map<number, THREE.BufferGeometry>();
  geometries.set(RendererShape.BOX, new THREE.BoxGeometry());
  geometries.set(RendererShape.SPHERE, new THREE.SphereGeometry(0.5));
  geometries.set(
    RendererShape.CYLINDER,
    new THREE.CylinderGeometry(0.5, 0.5, 1)
  );
  geometries.set(RendererShape.PLANE, new THREE.PlaneGeometry());
  return geometries;
}

export function initializeContext(): RenderingContext {
  const scene = new THREE.Scene();

  const ambient = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 1.5);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 2.5);
  directional.castShadow = true;
  directional.shadow.mapSize.width = 4096;
  directional.shadow.mapSize.height = 4096;
  scene.add(directional);
  scene.add(directional.target);

  return {
    scene,
    meshPools: new Map(),
    geometries: createGeometries(),
    material: new THREE.MeshStandardMaterial({
      metalness: 0.0,
      roughness: 0.8,
    }),
    entityInstances: new Map(),
    lights: {
      ambient: ambient,
      directional: directional,
    },
  };
}

export function getRenderingContext(state: State): RenderingContext {
  let context = stateToRenderingContext.get(state);
  if (!context) {
    context = initializeContext();
    stateToRenderingContext.set(state, context);
  }
  return context;
}

export function getScene(state: State): THREE.Scene | null {
  const context = stateToRenderingContext.get(state);
  return context?.scene || null;
}

export function setCanvasElement(
  entity: number,
  canvas: HTMLCanvasElement
): void {
  canvasElements.set(entity, canvas);
}

export function getCanvasElement(
  entity: number
): HTMLCanvasElement | undefined {
  return canvasElements.get(entity);
}

export function deleteCanvasElement(entity: number): void {
  canvasElements.delete(entity);
}

export function createRenderer(
  canvas: HTMLCanvasElement,
  clearColor: number
): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  if (clearColor !== 0) {
    renderer.setClearColor(clearColor);
  }

  return renderer;
}

export function handleWindowResize(
  _state: State,
  renderer: THREE.WebGLRenderer
): void {
  renderer.setSize(window.innerWidth, window.innerHeight);

  for (const [, camera] of threeCameras) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
}

export const SHADOW_CONFIG = {
  LIGHT_DIRECTION: new THREE.Vector3(5, 10, 2).normalize(),
  LIGHT_DISTANCE: 25,
  CAMERA_RADIUS: 50,
  NEAR_PLANE: 1,
  FAR_PLANE: 200,
} as const;
