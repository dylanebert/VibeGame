import * as GAME from 'vibegame';
import { Transform } from 'vibegame/transforms';
import { Renderer } from 'vibegame/rendering';
import { Particle } from './components';

const SIGMA = 10.0;
const RHO = 28.0;
const BETA = 8.0 / 3.0;
const SPEED = 0.5;

export function initializeLorenz(state: GAME.State, eid: number) {
  state.addComponent(eid, Particle);

  state.addComponent(eid, Transform);
  Transform.posX[eid] = Math.random() * 20 - 10;
  Transform.posY[eid] = Math.random() * 20 - 10;
  Transform.posZ[eid] = Math.random() * 20 - 10;
  Transform.scaleX[eid] = 0.5;
  Transform.scaleY[eid] = 0.5;
  Transform.scaleZ[eid] = 0.5;

  state.addComponent(eid, Renderer);
  Renderer.color[eid] = 0xff0000;
}

export function updateLorenz(state: GAME.State, eid: number) {
  let x = Transform.posX[eid];
  let y = Transform.posY[eid];
  let z = Transform.posZ[eid];

  const dx = SIGMA * (y - x);
  const dy = x * (RHO - z) - y;
  const dz = x * y - BETA * z;
  const dt = state.time.fixedDeltaTime;

  x += dx * dt * SPEED;
  y += dy * dt * SPEED;
  z += dz * dt * SPEED;

  Transform.posX[eid] = x;
  Transform.posY[eid] = y;
  Transform.posZ[eid] = z;
}
