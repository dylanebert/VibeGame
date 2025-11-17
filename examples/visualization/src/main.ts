import * as GAME from 'vibegame';
import { Transform } from 'vibegame/transforms';
import { Renderer, RenderContext, setCanvasElement } from 'vibegame/rendering';
import { TransformsPlugin } from 'vibegame/transforms';
import { RenderingPlugin } from 'vibegame/rendering';

const query = GAME.defineQuery([Transform, Renderer]);

const createAnimationSystem = (speedMultiplier = 1): GAME.System => ({
  group: 'draw',
  update: (state) => {
    const entities = query(state.world);
    const time = state.time.elapsed * speedMultiplier;

    let index = 0;
    for (const eid of entities) {
      const offset = (index * Math.PI * 2) / 10;

      const radius = 5;
      Transform.posX[eid] = Math.cos(time + offset) * radius;
      Transform.posZ[eid] = Math.sin(time + offset) * radius;
      Transform.posY[eid] = Math.sin(time * 2 + offset) * 2 + 3;

      Transform.eulerY[eid] = (time * 50 + index * 36) % 360;
      Transform.eulerX[eid] = Math.sin(time + offset) * 30;

      index++;
    }
  },
});

interface CanvasInstance {
  canvas: HTMLCanvasElement;
  worldElement: HTMLElement;
  speedMultiplier: number;
  state?: GAME.State;
  isVisible: boolean;
}

async function initializeState(instance: CanvasInstance): Promise<void> {
  const { canvas, worldElement, speedMultiplier } = instance;

  const state = new GAME.State();

  state.registerPlugin(TransformsPlugin);
  state.registerPlugin(RenderingPlugin);
  state.registerSystem(createAnimationSystem(speedMultiplier));

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

  if (parseResult.root.tagName === 'parsererror') {
    console.error('XML parsing failed for world:', worldElement);
    return;
  }

  GAME.parseXMLToEntities(state, parseResult.root);

  state.step(GAME.TIME_CONSTANTS.FIXED_TIMESTEP);

  instance.state = state;
}

async function initializeWorlds() {
  const worldElements = document.querySelectorAll('world');
  const instances: CanvasInstance[] = [];

  for (let i = 0; i < worldElements.length; i++) {
    const worldElement = worldElements[i] as HTMLElement;
    const canvasSelector = worldElement.getAttribute('canvas');

    if (!canvasSelector) {
      console.warn('World element missing canvas attribute:', worldElement);
      continue;
    }

    const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement;
    if (!canvas) {
      console.warn(`Canvas not found for selector: ${canvasSelector}`);
      continue;
    }

    instances.push({
      canvas,
      worldElement,
      speedMultiplier: 1 + i * 0.3,
      isVisible: false,
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const instance = instances.find((inst) => inst.canvas === entry.target);
        if (!instance) return;

        instance.isVisible = entry.isIntersecting;

        if (entry.isIntersecting && !instance.state) {
          initializeState(instance);
        }
      });
    },
    {
      rootMargin: '100px',
      threshold: 0.01,
    },
  );

  instances.forEach((instance) => {
    observer.observe(instance.canvas);
  });

  let lastTime = performance.now();

  const animate = (currentTime: number) => {
    requestAnimationFrame(animate);

    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    for (const instance of instances) {
      if (instance.state && instance.isVisible) {
        instance.state.step(deltaTime);
      }
    }
  };

  requestAnimationFrame(animate);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWorlds);
  } else {
    initializeWorlds();
  }
}
