import {
  BloomEffect as BloomEffectLib,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  type Effect,
} from 'postprocessing';
import * as THREE from 'three';
import type { State } from '../../core';
import { defineQuery, type System } from '../../core';
import { WorldTransform } from '../transforms';
import {
  Ambient,
  Bloom,
  Directional,
  Dithering,
  MainCamera,
  RenderContext,
  Renderer,
  Tonemapping,
} from './components';
import { DitheringEffect } from './dithering-effect';
import {
  getOrCreateMesh,
  hideInstance,
  updateInstance,
  updateShadowCamera,
} from './operations';
import {
  createRenderer,
  createThreeCamera,
  deleteCanvasElement,
  getCanvasElement,
  getRenderingContext,
  getScene,
  handleWindowResize,
  SHADOW_CONFIG,
  threeCameras,
} from './utils';

const rendererQuery = defineQuery([Renderer]);
const ambientQuery = defineQuery([Ambient]);
const directionalQuery = defineQuery([Directional]);
const mainCameraTransformQuery = defineQuery([MainCamera, WorldTransform]);
const mainCameraQuery = defineQuery([MainCamera]);
const renderContextQuery = defineQuery([RenderContext]);

export const MeshInstanceSystem: System = {
  group: 'draw',
  update(state: State) {
    const context = getRenderingContext(state);

    for (const [entity, instanceInfo] of context.entityInstances) {
      if (!state.exists(entity)) {
        const mesh = context.meshPools.get(instanceInfo.poolId);
        if (mesh) {
          hideInstance(mesh, entity, context);
        }
        context.entityInstances.delete(entity);
      }
    }

    const rendererEntities = rendererQuery(state.world);
    for (const entity of rendererEntities) {
      const mesh = getOrCreateMesh(context, Renderer.shape[entity]);
      if (!mesh) continue;

      if (Renderer.visible[entity] !== 1) {
        hideInstance(mesh, entity, context);
        continue;
      }

      updateInstance(mesh, entity, context, state);
    }

    updateShadowCamera(context, state);
  },
};

export const LightSyncSystem: System = {
  group: 'draw',
  update(state: State) {
    const context = getRenderingContext(state);
    const scene = getScene(state);
    if (!scene) return;

    const ambients = ambientQuery(state.world);
    for (const entity of ambients) {
      let light = context.lights.ambient;
      if (!light) {
        light = new THREE.HemisphereLight();
        scene.add(light);
        context.lights.ambient = light;
      }

      light.color.setHex(Ambient.skyColor[entity]);
      light.groundColor.setHex(Ambient.groundColor[entity]);
      light.intensity = Ambient.intensity[entity];
    }

    const directionals = directionalQuery(state.world);
    for (const entity of directionals) {
      let light = context.lights.directional;
      if (!light) {
        light = new THREE.DirectionalLight();
        light.castShadow = true;
        scene.add(light);
        scene.add(light.target);
        context.lights.directional = light;
      }

      light.color.setHex(Directional.color[entity]);
      light.intensity = Directional.intensity[entity];

      if (Directional.castShadow[entity] === 1) {
        light.castShadow = true;
        light.shadow.mapSize.width = Directional.shadowMapSize[entity];
        light.shadow.mapSize.height = Directional.shadowMapSize[entity];
      } else {
        light.castShadow = false;
      }

      const cameraTargets = mainCameraTransformQuery(state.world);
      let activeTarget: number | null = null;

      for (const cameraEntity of cameraTargets) {
        activeTarget = cameraEntity;
        break;
      }

      if (activeTarget !== null) {
        const targetPosition = new THREE.Vector3(
          WorldTransform.posX[activeTarget],
          WorldTransform.posY[activeTarget],
          WorldTransform.posZ[activeTarget]
        );

        const lightDirection = new THREE.Vector3(
          Directional.directionX[entity],
          Directional.directionY[entity],
          Directional.directionZ[entity]
        ).normalize();

        const lightPosition = targetPosition
          .clone()
          .add(lightDirection.multiplyScalar(Directional.distance[entity]));

        light.position.copy(lightPosition);
        light.target.position.copy(targetPosition);
        light.target.updateMatrixWorld();

        const shadowCamera = light.shadow.camera as THREE.OrthographicCamera;
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
    }
  },
};

export const CameraSyncSystem: System = {
  group: 'draw',
  update(state: State) {
    const context = getRenderingContext(state);
    const scene = getScene(state);

    if (!context.renderer || !scene) return;

    const cameraEntities = mainCameraTransformQuery(state.world);

    for (const entity of cameraEntities) {
      let camera = threeCameras.get(entity);
      if (!camera) {
        camera = createThreeCamera(entity);
      }

      camera.position.set(
        WorldTransform.posX[entity],
        WorldTransform.posY[entity],
        WorldTransform.posZ[entity]
      );

      camera.quaternion.set(
        WorldTransform.rotX[entity],
        WorldTransform.rotY[entity],
        WorldTransform.rotZ[entity],
        WorldTransform.rotW[entity]
      );

      let composer = context.composers.get(entity);
      if (!composer && context.renderer) {
        composer = new EffectComposer(context.renderer);
        composer.addPass(new RenderPass(scene, camera));
        context.composers.set(entity, composer);
        context.effects.set(entity, new Map());
      }

      if (composer) {
        const effectsMap = context.effects.get(entity)!;
        const currentBloomEffect = effectsMap.get('bloom');
        const currentDitheringEffect = effectsMap.get('dithering');
        const currentTonemappingEffect = effectsMap.get('tonemapping');
        const hasBloom = state.hasComponent(entity, Bloom);
        const hasDithering = state.hasComponent(entity, Dithering);
        const hasTonemapping = state.hasComponent(entity, Tonemapping);

        if (hasBloom) {
          if (!currentBloomEffect) {
            const bloomEffect = new BloomEffectLib({
              intensity: Bloom.intensity[entity],
              luminanceThreshold: Bloom.luminanceThreshold[entity],
              smoothing: Bloom.luminanceSmoothing[entity],
              mipmapBlur: Bloom.mipmapBlur[entity] === 1,
              radius: Bloom.radius[entity],
              levels: Bloom.levels[entity],
            });
            effectsMap.set('bloom', bloomEffect);
            rebuildEffectPass(composer, effectsMap, camera);
          } else {
            const bloom = currentBloomEffect as BloomEffectLib;
            bloom.intensity = Bloom.intensity[entity];
            bloom.luminanceMaterial.uniforms.threshold.value =
              Bloom.luminanceThreshold[entity];
            bloom.luminanceMaterial.uniforms.smoothing.value =
              Bloom.luminanceSmoothing[entity];
          }
        } else if (currentBloomEffect) {
          effectsMap.delete('bloom');
          rebuildEffectPass(composer, effectsMap, camera);
        }

        if (hasDithering) {
          if (!currentDitheringEffect) {
            const ditheringEffect = new DitheringEffect({
              colorBits: Dithering.colorBits[entity],
              intensity: Dithering.intensity[entity],
              grayscale: Dithering.grayscale[entity] === 1,
            });
            effectsMap.set('dithering', ditheringEffect);
            rebuildEffectPass(composer, effectsMap, camera);
          } else {
            const dithering = currentDitheringEffect as DitheringEffect;
            dithering.colorBits = Dithering.colorBits[entity];
            dithering.intensity = Dithering.intensity[entity];
            dithering.grayscale = Dithering.grayscale[entity] === 1;
            dithering.scale = Dithering.scale[entity];
            dithering.noise = Dithering.noise[entity];
          }
        } else if (currentDitheringEffect) {
          effectsMap.delete('dithering');
          rebuildEffectPass(composer, effectsMap, camera);
        }

        if (hasTonemapping) {
          if (!currentTonemappingEffect) {
            const tonemappingEffect = new ToneMappingEffect({
              mode: Tonemapping.mode[entity] as ToneMappingMode,
              middleGrey: Tonemapping.middleGrey[entity],
              whitePoint: Tonemapping.whitePoint[entity],
              averageLuminance: Tonemapping.averageLuminance[entity],
              adaptationRate: Tonemapping.adaptationRate[entity],
            });
            effectsMap.set('tonemapping', tonemappingEffect);
            rebuildEffectPass(composer, effectsMap, camera);
          } else {
            const tonemapping = currentTonemappingEffect as ToneMappingEffect;
            if (
              tonemapping.middleGrey !== Tonemapping.middleGrey[entity] ||
              tonemapping.whitePoint !== Tonemapping.whitePoint[entity] ||
              tonemapping.averageLuminance !==
                Tonemapping.averageLuminance[entity]
            ) {
              const newTonemappingEffect = new ToneMappingEffect({
                mode: Tonemapping.mode[entity] as ToneMappingMode,
                middleGrey: Tonemapping.middleGrey[entity],
                whitePoint: Tonemapping.whitePoint[entity],
                averageLuminance: Tonemapping.averageLuminance[entity],
                adaptationRate: Tonemapping.adaptationRate[entity],
              });
              effectsMap.set('tonemapping', newTonemappingEffect);
              rebuildEffectPass(composer, effectsMap, camera);
            } else {
              tonemapping.mode = Tonemapping.mode[entity] as ToneMappingMode;
            }
          }
        } else if (currentTonemappingEffect) {
          effectsMap.delete('tonemapping');
          rebuildEffectPass(composer, effectsMap, camera);
        }

        const size = context.renderer.getSize(new THREE.Vector2());
        composer.setSize(size.width, size.height);
      }
    }

    for (const [cameraEntity, composer] of context.composers) {
      if (!state.exists(cameraEntity)) {
        composer.dispose();
        context.composers.delete(cameraEntity);
        context.effects.delete(cameraEntity);
      }
    }
  },
};

function rebuildEffectPass(
  composer: EffectComposer,
  effectsMap: Map<string, Effect>,
  camera: THREE.Camera
): void {
  while (composer.passes.length > 1) {
    composer.removePass(composer.passes[1]);
  }

  if (effectsMap.size > 0) {
    const effects: Effect[] = [];
    if (effectsMap.has('bloom')) {
      effects.push(effectsMap.get('bloom')!);
    }
    if (effectsMap.has('dithering')) {
      effects.push(effectsMap.get('dithering')!);
    }
    if (effectsMap.has('tonemapping')) {
      effects.push(effectsMap.get('tonemapping')!);
    }
    const effectPass = new EffectPass(camera, ...effects);
    composer.addPass(effectPass);
  }
}

export const WebGLRenderSystem: System = {
  group: 'draw',
  last: true,
  setup(state: State) {
    const contextEntities = renderContextQuery(state.world);
    if (contextEntities.length === 0) return;

    const entity = contextEntities[0];
    const canvas = getCanvasElement(entity);
    if (!canvas) return;

    const clearColor = RenderContext.clearColor[entity];
    const renderer = createRenderer(canvas, clearColor);

    const context = getRenderingContext(state);
    context.renderer = renderer;
    context.canvas = canvas;

    window.addEventListener('resize', () =>
      handleWindowResize(state, renderer)
    );
  },
  update(state: State) {
    const context = getRenderingContext(state);
    if (!context.renderer) return;

    const scene = getScene(state);
    if (!scene) return;

    const cameraEntities = mainCameraQuery(state.world);
    if (cameraEntities.length === 0) return;

    const cameraEntity = cameraEntities[0];
    const composer = context.composers.get(cameraEntity);

    if (composer) {
      composer.render();
    }
  },
  dispose(state: State) {
    const context = getRenderingContext(state);
    if (context.renderer) {
      context.renderer.dispose();
      context.renderer = undefined;
      context.canvas = undefined;
    }

    const contextEntities = renderContextQuery(state.world);
    for (const entity of contextEntities) {
      deleteCanvasElement(entity);
    }
  },
};
