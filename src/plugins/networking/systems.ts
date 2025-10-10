import { defineQuery, type State, type System } from '../../core';
import { lerp, slerp } from '../../core/math/utils';
import { Body, KinematicMove, KinematicRotate, PhysicsWorld } from '../physics';
import {
  KinematicMovementSystem,
  PhysicsRapierSyncSystem,
} from '../physics/systems';
import { ClientAuthority, NetworkIdentity, RemoteSnapshot } from './components';
import { NetworkMessages, RENDER_DELAY_TICKS } from './constants';
import { getNetworkState } from './state';
import {
  handleIncomingStructuralUpdate,
  sendStructuralUpdates,
  syncRemoteBody,
} from './sync';
import type { BodyStateLike } from './types';

const clientAuthorityQuery = defineQuery([
  NetworkIdentity,
  ClientAuthority,
  Body,
]);
const remoteSnapshotQuery = defineQuery([NetworkIdentity, RemoteSnapshot]);
const physicsWorldQuery = defineQuery([PhysicsWorld]);
const allBodiesQuery = defineQuery([Body]);

function isPhysicsInitialized(state: State): boolean {
  return physicsWorldQuery(state.world).length > 0;
}

export const NetworkInitSystem: System = {
  group: 'setup',
  first: true,
  update(state: State) {
    const netState = getNetworkState(state);
    const room = netState.room;

    if (!room) {
      if (netState.networkIdToEntity.size > 0) {
        for (const entity of netState.networkIdToEntity.values()) {
          if (state.exists(entity)) {
            state.destroyEntity(entity);
          }
          netState.initializedEntities.delete(entity);
        }
        netState.networkIdToEntity.clear();
        netState.entityToNetworkId.clear();
        netState.remoteEntities.clear();
        netState.pendingNetworkIdRequests.clear();
      }
      netState.sessionId = undefined;
      return;
    }

    if (netState.sessionId !== room.sessionId) {
      netState.sessionId = room.sessionId;
    }

    room.onMessage(
      'network-id-assigned',
      ({
        localEntity,
        networkId,
      }: {
        localEntity: number;
        networkId: number;
      }) => {
        if (state.hasComponent(localEntity, ClientAuthority)) {
          NetworkIdentity.networkId[localEntity] = networkId;
          netState.entityToNetworkId.set(localEntity, networkId);
          netState.networkIdToEntity.set(networkId, localEntity);
          netState.pendingNetworkIdRequests.delete(localEntity);
          console.log(
            `[Client] Received network ID ${networkId} for owned entity ${localEntity}`
          );
        }
      }
    );
  },
};

export const NetworkAuthorityCleanupSystem: System = {
  group: 'setup',
  after: [NetworkInitSystem],
  update(state: State) {
    const netState = getNetworkState(state);
    if (!netState.room) return;

    for (const entity of allBodiesQuery(state.world)) {
      const hasClientAuth = state.hasComponent(entity, ClientAuthority);
      const hasRemote = state.hasComponent(entity, RemoteSnapshot);

      if (!hasClientAuth && !hasRemote) {
        console.log(
          `[Network] Destroying orphaned body ${entity} (no authority when connected)`
        );
        state.destroyEntity(entity);
      }
    }
  },
};

export const NetworkStructuralSendSystem: System = {
  group: 'setup',
  after: [NetworkAuthorityCleanupSystem],
  update(state: State) {
    const netState = getNetworkState(state);
    const room = netState.room;
    if (!room) return;

    const clientAuthorityEntities = clientAuthorityQuery(state.world);
    sendStructuralUpdates(state, netState, room, clientAuthorityEntities);
  },
};

export const NetworkSyncSystem: System = {
  group: 'setup',
  after: [NetworkInitSystem],
  update(state: State) {
    const netState = getNetworkState(state);
    const room = netState.room;
    if (!room || !room.state) return;

    if (!isPhysicsInitialized(state)) return;

    const activeNetworkIds = new Set<number>();

    if (room.state.structures) {
      const structures = room.state.structures as {
        forEach?: (
          cb: (
            structural: { networkId: number; owner: string; data: string },
            key: string
          ) => void
        ) => void;
      };

      if (typeof structures.forEach === 'function') {
        structures.forEach(
          (
            structural: { networkId: number; owner: string; data: string },
            _key: string
          ) => {
            const networkId = structural.networkId;
            if (structural.owner === netState.sessionId) return;

            activeNetworkIds.add(networkId);

            if (netState.remoteEntities.has(networkId)) return;

            try {
              const data = JSON.parse(structural.data);
              handleIncomingStructuralUpdate(state, netState, {
                networkId,
                components: data.components,
              });
            } catch (error) {
              console.warn(
                `[Network] Failed to parse structural data for network ID ${networkId}:`,
                error
              );
            }
          }
        );
      }
    }

    if (room.state.bodies) {
      const bodies = room.state.bodies as {
        forEach?: (
          cb: (
            body: BodyStateLike & { networkId: number; owner: string },
            key: string
          ) => void
        ) => void;
      };

      const forEach = bodies?.forEach;
      if (typeof forEach !== 'function') return;

      forEach.call(
        bodies,
        (
          bodyState: BodyStateLike & { networkId: number; owner: string },
          _key: string
        ) => {
          const networkId = bodyState.networkId;
          if (bodyState.owner === netState.sessionId) return;
          syncRemoteBody(state, networkId, bodyState, netState);
        }
      );
    }

    const toRemove: number[] = [];
    for (const networkId of netState.remoteEntities) {
      if (!activeNetworkIds.has(networkId)) {
        toRemove.push(networkId);
        const entity = netState.networkIdToEntity.get(networkId);
        if (entity !== undefined && state.exists(entity)) {
          state.destroyEntity(entity);
          netState.initializedEntities.delete(entity);
          netState.entityToNetworkId.delete(entity);
        }
      }
    }

    for (const networkId of toRemove) {
      netState.networkIdToEntity.delete(networkId);
      netState.remoteEntities.delete(networkId);
    }
  },
};

export const NetworkBufferConsumeSystem: System = {
  group: 'fixed',
  before: [KinematicMovementSystem],
  update(state: State) {
    const netState = getNetworkState(state);
    if (!netState.room) return;

    if (!isPhysicsInitialized(state)) return;

    for (const entity of remoteSnapshotQuery(state.world)) {
      const tick2 = RemoteSnapshot.tick2[entity];
      if (tick2 === 0) continue;

      const tick0 = RemoteSnapshot.tick0[entity];
      const tick1 = RemoteSnapshot.tick1[entity];

      if (RemoteSnapshot.localRenderTick[entity] === 0) {
        RemoteSnapshot.localRenderTick[entity] = Math.max(
          tick0,
          tick2 - RENDER_DELAY_TICKS
        );
      }

      RemoteSnapshot.localRenderTick[entity] += 1;

      if (RemoteSnapshot.localRenderTick[entity] < tick0) {
        RemoteSnapshot.localRenderTick[entity] = tick0;
      }

      const renderTick = Math.min(
        RemoteSnapshot.localRenderTick[entity],
        tick2
      );
      RemoteSnapshot.localRenderTick[entity] = renderTick;

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
      RemoteSnapshot.posX0[entity],
      RemoteSnapshot.posY0[entity],
      RemoteSnapshot.posZ0[entity],
      RemoteSnapshot.rotX0[entity],
      RemoteSnapshot.rotY0[entity],
      RemoteSnapshot.rotZ0[entity],
      RemoteSnapshot.rotW0[entity],
    ];
  } else if (index === 1) {
    return [
      RemoteSnapshot.posX1[entity],
      RemoteSnapshot.posY1[entity],
      RemoteSnapshot.posZ1[entity],
      RemoteSnapshot.rotX1[entity],
      RemoteSnapshot.rotY1[entity],
      RemoteSnapshot.rotZ1[entity],
      RemoteSnapshot.rotW1[entity],
    ];
  } else {
    return [
      RemoteSnapshot.posX2[entity],
      RemoteSnapshot.posY2[entity],
      RemoteSnapshot.posZ2[entity],
      RemoteSnapshot.rotX2[entity],
      RemoteSnapshot.rotY2[entity],
      RemoteSnapshot.rotZ2[entity],
      RemoteSnapshot.rotW2[entity],
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

    const entities = clientAuthorityQuery(state.world);
    if (entities.length === 0) return;

    for (const entity of entities) {
      const networkId = NetworkIdentity.networkId[entity];
      if (networkId === 0) continue;

      const snapshot = {
        networkId,
        posX: Body.posX[entity],
        posY: Body.posY[entity],
        posZ: Body.posZ[entity],
        rotX: Body.rotX[entity],
        rotY: Body.rotY[entity],
        rotZ: Body.rotZ[entity],
        rotW: Body.rotW[entity],
        grounded: Body.grounded[entity],
      };

      room.send(NetworkMessages.POSITION_UPDATE, snapshot);
    }
  },
};

export const NetworkCleanupSystem: System = {
  dispose(state: State) {
    const netState = getNetworkState(state);
    for (const entity of netState.networkIdToEntity.values()) {
      if (state.exists(entity)) {
        state.destroyEntity(entity);
      }
      netState.initializedEntities.delete(entity);
    }
    netState.networkIdToEntity.clear();
    netState.entityToNetworkId.clear();
    netState.remoteEntities.clear();
    netState.initializedEntities.clear();
    netState.pendingNetworkIdRequests.clear();
    netState.sessionId = undefined;

    if (netState.room) {
      netState.room.leave();
      netState.room = undefined;
    }
  },
};
