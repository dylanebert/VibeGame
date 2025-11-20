import * as GAME from 'vibegame';
import { InputPlugin } from 'vibegame/input';
import { OrbitCameraPlugin } from 'vibegame/orbit-camera';
import { RenderContext, RenderingPlugin, setCanvasElement } from 'vibegame/rendering';
import { TransformsPlugin } from 'vibegame/transforms';
import { TweenPlugin } from 'vibegame/tweening';
import { SequencerDemoPlugin, CubeController } from './plugin';

declare global {
  interface HTMLCanvasElement {
    __state__?: GAME.State;
    __stop__?: () => void;
  }
}

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
const worldElement = document.querySelector<HTMLElement>('world')!;

const state = new GAME.State();

state.registerPlugin(TransformsPlugin);
state.registerPlugin(RenderingPlugin);
state.registerPlugin(OrbitCameraPlugin);
state.registerPlugin(TweenPlugin);
state.registerPlugin(InputPlugin);
state.registerPlugin(SequencerDemoPlugin);

await state.initializePlugins();

worldElement.style.display = 'none';

const rendererEntity = state.createEntity();
state.addComponent(rendererEntity, RenderContext);
RenderContext.hasCanvas[rendererEntity] = 1;

const skyColor = worldElement.getAttribute('sky');
if (skyColor) {
  const parsedColor = GAME.XMLValueParser.parse(skyColor);
  if (typeof parsedColor === 'number') {
    RenderContext.clearColor[rendererEntity] = parsedColor;
  }
}

setCanvasElement(rendererEntity, canvas);

const xmlContent = `<world>${worldElement.innerHTML}</world>`;
const parseResult = GAME.XMLParser.parse(xmlContent);
GAME.parseXMLToEntities(state, parseResult.root);

canvas.__state__ = state;

state.step(GAME.TIME_CONSTANTS.FIXED_TIMESTEP);

const controller = state.getEntityByName('controller')!;

document.getElementById('btn-left')?.addEventListener('click', () => {
  CubeController.targetX[controller] = -5;
});
document.getElementById('btn-center')?.addEventListener('click', () => {
  CubeController.targetX[controller] = 0;
});
document.getElementById('btn-right')?.addEventListener('click', () => {
  CubeController.targetX[controller] = 5;
});
document.getElementById('btn-bounce')?.addEventListener('click', () => {
  CubeController.bounceRequested[controller] = 1;
});

let lastTime = performance.now();
let isRunning = true;

function animate(currentTime: number) {
  if (!isRunning) return;
  requestAnimationFrame(animate);
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  state.step(deltaTime);
}

canvas.__stop__ = () => {
  isRunning = false;
};

requestAnimationFrame(animate);
