import * as GAME from 'vibegame';
import { PositionModifier, SequencedTransform, SequencerPlugin } from 'vibegame/sequencer';
import { InputPlugin, InputState } from 'vibegame/input';
import { OrbitCamera, OrbitCameraPlugin } from 'vibegame/orbit-camera';
import { MainCamera, Renderer, RenderingPlugin } from 'vibegame/rendering';
import { Transform, TransformsPlugin } from 'vibegame/transforms';

let cubeEntity: number;
let modifierEntity: number;

const SetupSystem: GAME.System = {
  group: 'setup',
  setup: (state) => {
    const cameraTarget = state.createEntity();
    state.addComponent(cameraTarget, Transform);

    const camera = state.createEntity();
    state.addComponent(camera, OrbitCamera, {
      target: cameraTarget,
      inputSource: camera,
      offsetY: 0,
      currentDistance: 10,
      targetDistance: 10,
      currentPitch: Math.PI / 6,
      targetPitch: Math.PI / 6,
      minPitch: -Math.PI / 2,
      maxPitch: Math.PI / 2,
      zoomSensitivity: 0.0
    });
    state.addComponent(camera, Transform);
    state.addComponent(camera, MainCamera);
    state.addComponent(camera, InputState);

    cubeEntity = state.createEntity();
    state.addComponent(cubeEntity, SequencedTransform);
    SequencedTransform.scaleX[cubeEntity] = 1;
    SequencedTransform.scaleY[cubeEntity] = 1;
    SequencedTransform.scaleZ[cubeEntity] = 1;

    state.addComponent(cubeEntity, Transform);

    state.addComponent(cubeEntity, Renderer);
    Renderer.shape[cubeEntity] = 0;
    Renderer.sizeX[cubeEntity] = 1;
    Renderer.sizeY[cubeEntity] = 1;
    Renderer.sizeZ[cubeEntity] = 1;
    Renderer.color[cubeEntity] = 0xff0000;

    modifierEntity = state.createEntity();
    state.addComponent(modifierEntity, PositionModifier);
    PositionModifier.target[modifierEntity] = cubeEntity;
  },
};

const AnimationSystem: GAME.System = {
  group: 'simulation',
  update: (state) => {
    const time = state.time.elapsed;
    SequencedTransform.posX[cubeEntity] = Math.sin(time);
    PositionModifier.y[modifierEntity] = Math.sin(time * 2);
  },
};

const DemoPlugin: GAME.Plugin = {
  systems: [SetupSystem, AnimationSystem],
};

GAME
  .withoutDefaultPlugins()
  .withPlugins(TransformsPlugin, RenderingPlugin, InputPlugin, OrbitCameraPlugin)
  .withPlugins(SequencerPlugin, DemoPlugin)
  .run();
