import type { State } from '../../core';
import { Body, BodyType } from '../physics';
import { Renderer } from '../rendering';
import { Networked } from './components';
import type { BodyStateLike, NetworkState } from './types';
import { hashString } from './utils';

export function syncRemoteBody(
  state: State,
  sessionId: string,
  bodyState: BodyStateLike,
  netState: NetworkState
): void {
  let entity = netState.sessionIdToEntity.get(sessionId);

  if (!entity) {
    entity = state.createEntity();
    netState.sessionIdToEntity.set(sessionId, entity);

    state.addComponent(entity, Networked);
    Networked.sessionId[entity] = hashString(sessionId);

    state.addComponent(entity, Body);
    Body.type[entity] = BodyType.KinematicPositionBased;

    state.addComponent(entity, Renderer);

    initializeSnapshotBuffer(entity, bodyState);

    console.log(
      `[Network] Remote body spawned: ${sessionId} → entity ${entity}`
    );
    return;
  }

  const serverTick = bodyState.tick ?? 0;
  const latestTick = Networked.tick2[entity];

  if (serverTick <= latestTick) return;

  insertSnapshotIntoBuffer(entity, bodyState, serverTick);
}

function initializeSnapshotBuffer(
  entity: number,
  bodyState: BodyStateLike
): void {
  const tick = bodyState.tick ?? 0;

  Networked.tick0[entity] = tick;
  Networked.posX0[entity] = bodyState.posX;
  Networked.posY0[entity] = bodyState.posY;
  Networked.posZ0[entity] = bodyState.posZ;
  Networked.rotX0[entity] = bodyState.rotX;
  Networked.rotY0[entity] = bodyState.rotY;
  Networked.rotZ0[entity] = bodyState.rotZ;
  Networked.rotW0[entity] = bodyState.rotW;

  Networked.tick1[entity] = tick;
  Networked.posX1[entity] = bodyState.posX;
  Networked.posY1[entity] = bodyState.posY;
  Networked.posZ1[entity] = bodyState.posZ;
  Networked.rotX1[entity] = bodyState.rotX;
  Networked.rotY1[entity] = bodyState.rotY;
  Networked.rotZ1[entity] = bodyState.rotZ;
  Networked.rotW1[entity] = bodyState.rotW;

  Networked.tick2[entity] = tick;
  Networked.posX2[entity] = bodyState.posX;
  Networked.posY2[entity] = bodyState.posY;
  Networked.posZ2[entity] = bodyState.posZ;
  Networked.rotX2[entity] = bodyState.rotX;
  Networked.rotY2[entity] = bodyState.rotY;
  Networked.rotZ2[entity] = bodyState.rotZ;
  Networked.rotW2[entity] = bodyState.rotW;
}

function insertSnapshotIntoBuffer(
  entity: number,
  bodyState: BodyStateLike,
  tick: number
): void {
  Networked.tick0[entity] = Networked.tick1[entity];
  Networked.posX0[entity] = Networked.posX1[entity];
  Networked.posY0[entity] = Networked.posY1[entity];
  Networked.posZ0[entity] = Networked.posZ1[entity];
  Networked.rotX0[entity] = Networked.rotX1[entity];
  Networked.rotY0[entity] = Networked.rotY1[entity];
  Networked.rotZ0[entity] = Networked.rotZ1[entity];
  Networked.rotW0[entity] = Networked.rotW1[entity];

  Networked.tick1[entity] = Networked.tick2[entity];
  Networked.posX1[entity] = Networked.posX2[entity];
  Networked.posY1[entity] = Networked.posY2[entity];
  Networked.posZ1[entity] = Networked.posZ2[entity];
  Networked.rotX1[entity] = Networked.rotX2[entity];
  Networked.rotY1[entity] = Networked.rotY2[entity];
  Networked.rotZ1[entity] = Networked.rotZ2[entity];
  Networked.rotW1[entity] = Networked.rotW2[entity];

  Networked.tick2[entity] = tick;
  Networked.posX2[entity] = bodyState.posX;
  Networked.posY2[entity] = bodyState.posY;
  Networked.posZ2[entity] = bodyState.posZ;
  Networked.rotX2[entity] = bodyState.rotX;
  Networked.rotY2[entity] = bodyState.rotY;
  Networked.rotZ2[entity] = bodyState.rotZ;
  Networked.rotW2[entity] = bodyState.rotW;
}

export function cleanupMissingBodies(
  state: State,
  netState: NetworkState,
  activeSessions: Set<string>
): void {
  const toRemove: string[] = [];

  for (const [sessionId, entity] of netState.sessionIdToEntity) {
    if (!activeSessions.has(sessionId)) {
      toRemove.push(sessionId);
      if (state.exists(entity)) {
        console.log(
          `[Network] Remote body destroyed: ${sessionId} → entity ${entity}`
        );
        state.destroyEntity(entity);
      }
    }
  }

  for (const sessionId of toRemove) {
    netState.sessionIdToEntity.delete(sessionId);
  }
}
