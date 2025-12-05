import './components.css';
import { State, XMLParser, XMLValueParser, parseXMLToEntities } from 'vibegame';
import { TransformsPlugin } from 'vibegame/transforms';
import { RenderingPlugin, RenderContext, setCanvasElement } from 'vibegame/rendering';
import { OrbitCameraPlugin } from 'vibegame/orbit-camera';
import { TweenPlugin, playSequence, resetSequence } from 'vibegame/tweening';
import { injectSequences, STEP_SEQUENCES } from './sequences';
import { VisualizationPlugin } from './plugin';

function calculateMaxStep(): number {
  let max = 0;
  for (const key of Object.keys(STEP_SEQUENCES)) {
    const [from, to] = key.split('-').map(Number);
    max = Math.max(max, from, to);
  }
  return max;
}

const maxStep = calculateMaxStep();

interface CanvasInstance {
  canvas: HTMLCanvasElement;
  worldElement: Element;
  state: State | null;
  isVisible: boolean;
  currentStep: number;
}

function initializeCanvas(instance: CanvasInstance): void {
  const state = new State();
  state.registerPlugin(TransformsPlugin);
  state.registerPlugin(RenderingPlugin);
  state.registerPlugin(OrbitCameraPlugin);
  state.registerPlugin(TweenPlugin);
  state.registerPlugin(VisualizationPlugin);

  injectSequences(instance.worldElement);

  const rendererEntity = state.createEntity();
  state.addComponent(rendererEntity, RenderContext);
  RenderContext.hasCanvas[rendererEntity] = 1;

  const skyAttr = instance.worldElement.getAttribute('sky');
  if (skyAttr) {
    const parsedColor = XMLValueParser.parse(skyAttr);
    if (typeof parsedColor === 'number') {
      RenderContext.clearColor[rendererEntity] = parsedColor;
    }
  }

  setCanvasElement(rendererEntity, instance.canvas);

  const xmlContent = `<world>${instance.worldElement.innerHTML}</world>`;
  const parseResult = XMLParser.parse(xmlContent);
  parseXMLToEntities(state, parseResult.root);

  state.step(0);
  instance.state = state;

  setupUI(instance);
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

function updateStepDisplay(instance: CanvasInstance): void {
  const display = document.getElementById('step-display');
  if (display) {
    display.textContent = `Step: ${instance.currentStep}/${maxStep}`;
  }
}

function goToStep(instance: CanvasInstance, newStep: number): void {
  if (!instance.state) return;
  const clampedStep = Math.max(0, Math.min(maxStep, newStep));
  if (clampedStep === instance.currentStep) return;

  triggerSequence(instance.state, instance.currentStep, clampedStep);
  instance.currentStep = clampedStep;
  updateStepDisplay(instance);
}

function setupUI(instance: CanvasInstance): void {
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');

  prevBtn?.addEventListener('click', () => goToStep(instance, instance.currentStep - 1));
  nextBtn?.addEventListener('click', () => goToStep(instance, instance.currentStep + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goToStep(instance, instance.currentStep - 1);
    if (e.key === 'ArrowRight') goToStep(instance, instance.currentStep + 1);
  });

  updateStepDisplay(instance);
}

const instances: CanvasInstance[] = [];

function init(): void {
  const canvases = document.querySelectorAll<HTMLCanvasElement>('.game-canvas');

  for (const canvas of canvases) {
    const worldElement = document.querySelector(`world[canvas="#${canvas.id}"]`);
    if (!worldElement) continue;

    instances.push({
      canvas,
      worldElement,
      state: null,
      isVisible: false,
      currentStep: 0,
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const instance = instances.find((i) => i.canvas === entry.target);
        if (!instance) continue;
        instance.isVisible = entry.isIntersecting;
        if (entry.isIntersecting && !instance.state) {
          initializeCanvas(instance);
        }
      }
    },
    { rootMargin: '100px', threshold: 0.01 }
  );

  for (const instance of instances) {
    observer.observe(instance.canvas);
  }

  let lastTime = performance.now();
  function animate(): void {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    for (const instance of instances) {
      if (instance.isVisible && instance.state) {
        instance.state.step(dt);
      }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
