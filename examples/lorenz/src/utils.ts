import * as GAME from 'vibegame';
import { Particle } from './components';

const SIGMA = 10.0;
const RHO = 28.0;
const BETA = 8.0 / 3.0;
const SPEED = 0.5;

export function initializeLorenz(state: GAME.State, eid: number) {
  state.addComponent(eid, Particle);

  state.addComponent(eid, GAME.Transform);
  GAME.Transform.posX[eid] = Math.random() * 20 - 10;
  GAME.Transform.posY[eid] = Math.random() * 20 - 10;
  GAME.Transform.posZ[eid] = Math.random() * 20 - 10;
  GAME.Transform.scaleX[eid] = 0.5;
  GAME.Transform.scaleY[eid] = 0.5;
  GAME.Transform.scaleZ[eid] = 0.5;

  state.addComponent(eid, GAME.Renderer);
  GAME.Renderer.color[eid] = 0xff0000;
}

export function updateLorenz(state: GAME.State, eid: number) {
  let x = GAME.Transform.posX[eid];
  let y = GAME.Transform.posY[eid];
  let z = GAME.Transform.posZ[eid];

  const dx = SIGMA * (y - x);
  const dy = x * (RHO - z) - y;
  const dz = x * y - BETA * z;
  const dt = state.time.fixedDeltaTime;

  x += dx * dt * SPEED;
  y += dy * dt * SPEED;
  z += dz * dt * SPEED;

  GAME.Transform.posX[eid] = x;
  GAME.Transform.posY[eid] = y;
  GAME.Transform.posZ[eid] = z;
}
