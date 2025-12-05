import { State, XMLParser, XMLValueParser, parseXMLToEntities } from 'vibegame';
import { TransformsPlugin } from 'vibegame/transforms';
import { RenderingPlugin, RenderContext, setCanvasElement } from 'vibegame/rendering';
import { OrbitCameraPlugin } from 'vibegame/orbit-camera';
import { TweenPlugin, playSequence, resetSequence } from 'vibegame/tweening';
import { injectSequences, STEP_SEQUENCES } from './sequences';

declare global {
  interface HTMLCanvasElement {
    __state__?: State;
    __stop__?: () => void;
  }
}

let currentStep = 0;
let state: State | null = null;
let running = true;

function initializeState(canvas: HTMLCanvasElement, worldElement: Element): State {
  const newState = new State();
  newState.registerPlugin(TransformsPlugin);
  newState.registerPlugin(RenderingPlugin);
  newState.registerPlugin(OrbitCameraPlugin);
  newState.registerPlugin(TweenPlugin);

  injectSequences(worldElement);

  const rendererEntity = newState.createEntity();
  newState.addComponent(rendererEntity, RenderContext);
  RenderContext.hasCanvas[rendererEntity] = 1;

  const skyAttr = worldElement.getAttribute('sky');
  if (skyAttr) {
    const parsedColor = XMLValueParser.parse(skyAttr);
    if (typeof parsedColor === 'number') {
      RenderContext.clearColor[rendererEntity] = parsedColor;
    }
  }

  setCanvasElement(rendererEntity, canvas);

  const xmlContent = `<world>${worldElement.innerHTML}</world>`;
  const parseResult = XMLParser.parse(xmlContent);
  parseXMLToEntities(newState, parseResult.root);

  newState.step(0);
  return newState;
}

function triggerSequence(state: State, fromStep: number, toStep: number): void {
  const key = `${fromStep}-${toStep}`;
  const sequenceName = STEP_SEQUENCES[key];
  if (!sequenceName) return;

  const seqEntity = state.getEntityByName(sequenceName);
  if (seqEntity !== null) {
    resetSequence(state, seqEntity);
    playSequence(state, seqEntity);
  }
}

function updateStepDisplay(): void {
  const display = document.getElementById('step-display');
  if (display) {
    display.textContent = `Step: ${currentStep}`;
  }
}

function goToStep(newStep: number): void {
  if (!state) return;
  const clampedStep = Math.max(0, Math.min(1, newStep));
  if (clampedStep === currentStep) return;

  triggerSequence(state, currentStep, clampedStep);
  currentStep = clampedStep;
  updateStepDisplay();
}

function init(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#canvas-1');
  const worldElement = document.querySelector('world[canvas="#canvas-1"]');
  if (!canvas || !worldElement) return;

  state = initializeState(canvas, worldElement);

  canvas.__state__ = state;
  canvas.__stop__ = () => {
    running = false;
  };

  updateStepDisplay();

  document.getElementById('btn-prev')?.addEventListener('click', () => goToStep(currentStep - 1));
  document.getElementById('btn-next')?.addEventListener('click', () => goToStep(currentStep + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goToStep(currentStep - 1);
    if (e.key === 'ArrowRight') goToStep(currentStep + 1);
  });

  let lastTime = performance.now();
  function animate(): void {
    if (!running || !state) return;
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    state.step(dt);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
