import './components.css';
import { State, XMLParser, XMLValueParser, parseXMLToEntities } from 'vibegame';
import { TransformsPlugin } from 'vibegame/transforms';
import { RenderingPlugin, RenderContext, setCanvasElement } from 'vibegame/rendering';
import { OrbitCameraPlugin } from 'vibegame/orbit-camera';
import { TweenPlugin, playSequence, resetSequence } from 'vibegame/tweening';
import { injectSequences } from './sequences';

interface CanvasInstance {
  canvas: HTMLCanvasElement;
  worldElement: Element;
  state: State | null;
  isVisible: boolean;
}

function initializeCanvas(instance: CanvasInstance): void {
  const state = new State();
  state.registerPlugin(TransformsPlugin);
  state.registerPlugin(RenderingPlugin);
  state.registerPlugin(OrbitCameraPlugin);
  state.registerPlugin(TweenPlugin);

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

  setupUI(state);
}

function setupUI(state: State): void {
  const playBtn = document.getElementById('btn-play');
  const resetBtn = document.getElementById('btn-reset');

  playBtn?.addEventListener('click', () => {
    const introSeq = state.getEntityByName('intro');
    if (introSeq !== null) {
      resetSequence(state, introSeq);
      playSequence(state, introSeq);
    }
  });

  resetBtn?.addEventListener('click', () => {
    const resetSeq = state.getEntityByName('reset');
    if (resetSeq !== null) {
      resetSequence(state, resetSeq);
      playSequence(state, resetSeq);
    }
  });
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
