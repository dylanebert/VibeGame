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
  MainCamera,
  getRenderingContext,
  getScene,
  threeCameras,
} from '../rendering';
import { Bloom, Dithering, Tonemapping } from './components';
import { DitheringEffect } from './effects/dithering-effect';
import { getPostprocessingContext } from './utils';

const mainCameraTransformQuery = defineQuery([MainCamera, WorldTransform]);
const mainCameraQuery = defineQuery([MainCamera]);

export const PostprocessingSystem: System = {
  group: 'draw',
  update(state: State) {
    const renderContext = getRenderingContext(state);
    const postContext = getPostprocessingContext(state);
    const scene = getScene(state);

    if (!renderContext.renderer || !scene) return;

    const cameraEntities = mainCameraTransformQuery(state.world);

    for (const entity of cameraEntities) {
      const camera = threeCameras.get(entity);
      if (!camera) continue;

      let composer = postContext.composers.get(entity);
      if (!composer) {
        composer = new EffectComposer(renderContext.renderer);
        composer.addPass(new RenderPass(scene, camera));
        postContext.composers.set(entity, composer);
        postContext.effects.set(entity, new Map());
      }

      const effectsMap = postContext.effects.get(entity)!;
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

      const size = renderContext.renderer.getSize(new THREE.Vector2());
      composer.setSize(size.width, size.height);
    }

    for (const [cameraEntity, composer] of postContext.composers) {
      if (!state.exists(cameraEntity)) {
        composer.dispose();
        postContext.composers.delete(cameraEntity);
        postContext.effects.delete(cameraEntity);
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

export const PostprocessingRenderSystem: System = {
  group: 'draw',
  last: true,
  update(state: State) {
    const postContext = getPostprocessingContext(state);
    const cameraEntities = mainCameraQuery(state.world);

    if (cameraEntities.length === 0) return;

    const cameraEntity = cameraEntities[0];
    const composer = postContext.composers.get(cameraEntity);

    if (composer) {
      composer.render();
    }
  },
};
