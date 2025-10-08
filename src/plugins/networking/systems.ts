import { defineQuery, type State, type System } from '../../core';
import { lerp, slerp } from '../../core/math/utils';
import { Body, KinematicMove, KinematicRotate } from '../physics';
import {
  KinematicMovementSystem,
  PhysicsRapierSyncSystem,
} from '../physics/systems';
import { Networked, Owned } from './components';
import { NetworkMessages, RENDER_DELAY_TICKS } from './constants';
import { getNetworkState } from './state';
import { cleanupMissingBodies, syncRemoteBody } from './sync';
import type { BodyStateLike } from './types';

const ownedQuery = defineQuery([Owned, Body]);
const networkedQuery = defineQuery([Networked]);

export const NetworkInitSystem: System = {
  group: 'setup',
  first: true,
  update(state: State) {
    const netState = getNetworkState(state);
    const room = netState.room;

    if (!room) {
      if (netState.compositeKeyToEntity.size > 0) {
        console.log('[Network] No room, cleaning up all remote bodies');
        cleanupMissingBodies(state, netState, new Set());
      }
      netState.sessionId = undefined;
      return;
    }

    if (netState.sessionId !== room.sessionId) {
      netState.sessionId = room.sessionId;
      console.log(`[Network] Connected as ${room.sessionId}`);
    }
  },
};

export const NetworkSyncSystem: System = {
  group: 'setup',
  after: [NetworkInitSystem],
  update(state: State) {
    const netState = getNetworkState(state);
    const room = netState.room;
    if (!room || !room.state?.bodies) return;

    const bodies = room.state.bodies as {
      forEach?: (
        cb: (body: BodyStateLike, compositeKey: string) => void
      ) => void;
    };

    const forEach = bodies?.forEach;
    if (typeof forEach !== 'function') return;

    const activeKeys = new Set<string>();

    forEach.call(bodies, (bodyState: BodyStateLike, compositeKey: string) => {
      const colonIndex = compositeKey.indexOf(':');
      if (colonIndex === -1) return;
      const sessionId = compositeKey.slice(0, colonIndex);

      if (sessionId === netState.sessionId) return;

      activeKeys.add(compositeKey);
      syncRemoteBody(state, compositeKey, bodyState, netState);
    });

    cleanupMissingBodies(state, netState, activeKeys);
  },
};

export const NetworkBufferConsumeSystem: System = {
  group: 'fixed',
  before: [KinematicMovementSystem],
  update(state: State) {
    const netState = getNetworkState(state);
    if (!netState.room) return;

    for (const entity of networkedQuery(state.world)) {
      const tick2 = Networked.tick2[entity];
      if (tick2 === 0) continue;

      const tick0 = Networked.tick0[entity];
      const tick1 = Networked.tick1[entity];

      if (Networked.localRenderTick[entity] === 0) {
        Networked.localRenderTick[entity] = Math.max(
          tick0,
          tick2 - RENDER_DELAY_TICKS
        );
      }

      Networked.localRenderTick[entity] += 1;

      if (Networked.localRenderTick[entity] < tick0) {
        Networked.localRenderTick[entity] = tick0;
      }

      const renderTick = Math.min(Networked.localRenderTick[entity], tick2);
      Networked.localRenderTick[entity] = renderTick;

      let t = 0;
      let fromIdx: 0 | 1 | 2 = 1;
      let toIdx: 0 | 1 | 2 = 2;

      if (renderTick <= tick0) {
        fromIdx = 0;
        toIdx = 0;
        t = 0;
      } else if (renderTick >= tick2) {
        fromIdx = 2;
        toIdx = 2;
        t = 0;
      } else if (renderTick >= tick1) {
        fromIdx = 1;
        toIdx = 2;
        const tickDelta = tick2 - tick1;
        t = tickDelta > 0 ? (renderTick - tick1) / tickDelta : 0;
      } else {
        fromIdx = 0;
        toIdx = 1;
        const tickDelta = tick1 - tick0;
        t = tickDelta > 0 ? (renderTick - tick0) / tickDelta : 0;
      }

      const [posX0, posY0, posZ0, rotX0, rotY0, rotZ0, rotW0] = getSnapshot(
        entity,
        fromIdx
      );
      const [posX1, posY1, posZ1, rotX1, rotY1, rotZ1, rotW1] = getSnapshot(
        entity,
        toIdx
      );

      const posX = lerp(posX0, posX1, t);
      const posY = lerp(posY0, posY1, t);
      const posZ = lerp(posZ0, posZ1, t);

      const rot = slerp(
        rotX0,
        rotY0,
        rotZ0,
        rotW0,
        rotX1,
        rotY1,
        rotZ1,
        rotW1,
        t
      );

      if (!state.hasComponent(entity, KinematicMove)) {
        state.addComponent(entity, KinematicMove);
      }
      KinematicMove.x[entity] = posX;
      KinematicMove.y[entity] = posY;
      KinematicMove.z[entity] = posZ;

      if (!state.hasComponent(entity, KinematicRotate)) {
        state.addComponent(entity, KinematicRotate);
      }
      KinematicRotate.x[entity] = rot.x;
      KinematicRotate.y[entity] = rot.y;
      KinematicRotate.z[entity] = rot.z;
      KinematicRotate.w[entity] = rot.w;
    }
  },
};

function getSnapshot(
  entity: number,
  index: 0 | 1 | 2
): [number, number, number, number, number, number, number] {
  if (index === 0) {
    return [
      Networked.posX0[entity],
      Networked.posY0[entity],
      Networked.posZ0[entity],
      Networked.rotX0[entity],
      Networked.rotY0[entity],
      Networked.rotZ0[entity],
      Networked.rotW0[entity],
    ];
  } else if (index === 1) {
    return [
      Networked.posX1[entity],
      Networked.posY1[entity],
      Networked.posZ1[entity],
      Networked.rotX1[entity],
      Networked.rotY1[entity],
      Networked.rotZ1[entity],
      Networked.rotW1[entity],
    ];
  } else {
    return [
      Networked.posX2[entity],
      Networked.posY2[entity],
      Networked.posZ2[entity],
      Networked.rotX2[entity],
      Networked.rotY2[entity],
      Networked.rotZ2[entity],
      Networked.rotW2[entity],
    ];
  }
}

export const NetworkSendSystem: System = {
  group: 'fixed',
  after: [PhysicsRapierSyncSystem],
  update(state: State) {
    if (!state.isClient) return;

    const netState = getNetworkState(state);
    const room = netState.room;
    if (!room) return;

    const entities = ownedQuery(state.world);
    if (entities.length === 0) return;

    for (const entity of entities) {
      const snapshot = {
        entity,
        posX: Body.posX[entity],
        posY: Body.posY[entity],
        posZ: Body.posZ[entity],
        rotX: Body.rotX[entity],
        rotY: Body.rotY[entity],
        rotZ: Body.rotZ[entity],
        rotW: Body.rotW[entity],
      };

      room.send(NetworkMessages.POSITION_UPDATE, snapshot);
    }
  },
};

export const NetworkCleanupSystem: System = {
  dispose(state: State) {
    const netState = getNetworkState(state);
    cleanupMissingBodies(state, netState, new Set());
    netState.compositeKeyToEntity.clear();
    netState.sessionId = undefined;

    if (netState.room) {
      console.log('[Network] Disconnecting from room');
      netState.room.leave();
      netState.room = undefined;
    }
  },
};
