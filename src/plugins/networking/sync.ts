import type { Room } from 'colyseus.js';
import type { State } from '../../core';
import {
  deserializeComponent,
  serializeComponent,
} from '../../core/ecs/serialization';
import { Body, BodyType } from '../physics';
import { NetworkIdentity, RemoteSnapshot } from './components';
import { NetworkMessages } from './constants';
import type { BodyStateLike, NetworkState, StructuralUpdate } from './types';
import { hashString } from './utils';

export function handleIncomingStructuralUpdate(
  state: State,
  netState: NetworkState,
  data: StructuralUpdate
): void {
  const networkId = data.networkId;
  let entity = netState.networkIdToEntity.get(networkId);

  if (!entity) {
    entity = state.createEntity();
    netState.networkIdToEntity.set(networkId, entity);
    netState.entityToNetworkId.set(entity, networkId);
    netState.remoteEntities.add(networkId);

    state.addComponent(entity, NetworkIdentity);
    NetworkIdentity.networkId[entity] = networkId;

    state.addComponent(entity, RemoteSnapshot);
    RemoteSnapshot.sessionId[entity] = hashString(networkId.toString());
    initializeSnapshotBuffer(entity);
  }

  for (const [componentName, componentData] of Object.entries(
    data.components
  )) {
    const Component = state.getComponent(componentName);
    if (!Component) {
      console.warn(
        `[Network] Unknown component in structural update: ${componentName}`
      );
      continue;
    }

    if (!state.hasComponent(entity, Component)) {
      state.addComponent(entity, Component);
    }

    if (Object.keys(componentData).length > 0) {
      deserializeComponent(Component, entity, componentData);
    }
  }

  if (
    state.hasComponent(entity, Body) &&
    Body.type[entity] !== BodyType.Fixed
  ) {
    Body.type[entity] = BodyType.KinematicPositionBased;
  }
}

function initializeSnapshotBuffer(entity: number): void {
  RemoteSnapshot.tick0[entity] = 0;
  RemoteSnapshot.posX0[entity] = 0;
  RemoteSnapshot.posY0[entity] = 0;
  RemoteSnapshot.posZ0[entity] = 0;
  RemoteSnapshot.rotX0[entity] = 0;
  RemoteSnapshot.rotY0[entity] = 0;
  RemoteSnapshot.rotZ0[entity] = 0;
  RemoteSnapshot.rotW0[entity] = 1;

  RemoteSnapshot.tick1[entity] = 0;
  RemoteSnapshot.posX1[entity] = 0;
  RemoteSnapshot.posY1[entity] = 0;
  RemoteSnapshot.posZ1[entity] = 0;
  RemoteSnapshot.rotX1[entity] = 0;
  RemoteSnapshot.rotY1[entity] = 0;
  RemoteSnapshot.rotZ1[entity] = 0;
  RemoteSnapshot.rotW1[entity] = 1;

  RemoteSnapshot.tick2[entity] = 0;
  RemoteSnapshot.posX2[entity] = 0;
  RemoteSnapshot.posY2[entity] = 0;
  RemoteSnapshot.posZ2[entity] = 0;
  RemoteSnapshot.rotX2[entity] = 0;
  RemoteSnapshot.rotY2[entity] = 0;
  RemoteSnapshot.rotZ2[entity] = 0;
  RemoteSnapshot.rotW2[entity] = 1;
}

export function syncRemoteBody(
  _state: State,
  networkId: number,
  bodyState: BodyStateLike,
  netState: NetworkState
): void {
  const entity = netState.networkIdToEntity.get(networkId);

  if (!entity) {
    console.debug(
      `[Network] Received body update for unknown network ID: ${networkId}. Waiting for structural update.`
    );
    return;
  }

  const serverTick = bodyState.tick ?? 0;
  const latestTick = RemoteSnapshot.tick2[entity];

  if (serverTick <= latestTick) {
    return;
  }

  insertSnapshotIntoBuffer(entity, bodyState, serverTick);
}

function insertSnapshotIntoBuffer(
  entity: number,
  bodyState: BodyStateLike,
  tick: number
): void {
  RemoteSnapshot.tick0[entity] = RemoteSnapshot.tick1[entity];
  RemoteSnapshot.posX0[entity] = RemoteSnapshot.posX1[entity];
  RemoteSnapshot.posY0[entity] = RemoteSnapshot.posY1[entity];
  RemoteSnapshot.posZ0[entity] = RemoteSnapshot.posZ1[entity];
  RemoteSnapshot.rotX0[entity] = RemoteSnapshot.rotX1[entity];
  RemoteSnapshot.rotY0[entity] = RemoteSnapshot.rotY1[entity];
  RemoteSnapshot.rotZ0[entity] = RemoteSnapshot.rotZ1[entity];
  RemoteSnapshot.rotW0[entity] = RemoteSnapshot.rotW1[entity];

  RemoteSnapshot.tick1[entity] = RemoteSnapshot.tick2[entity];
  RemoteSnapshot.posX1[entity] = RemoteSnapshot.posX2[entity];
  RemoteSnapshot.posY1[entity] = RemoteSnapshot.posY2[entity];
  RemoteSnapshot.posZ1[entity] = RemoteSnapshot.posZ2[entity];
  RemoteSnapshot.rotX1[entity] = RemoteSnapshot.rotX2[entity];
  RemoteSnapshot.rotY1[entity] = RemoteSnapshot.rotY2[entity];
  RemoteSnapshot.rotZ1[entity] = RemoteSnapshot.rotZ2[entity];
  RemoteSnapshot.rotW1[entity] = RemoteSnapshot.rotW2[entity];

  RemoteSnapshot.tick2[entity] = tick;
  RemoteSnapshot.posX2[entity] = bodyState.posX;
  RemoteSnapshot.posY2[entity] = bodyState.posY;
  RemoteSnapshot.posZ2[entity] = bodyState.posZ;
  RemoteSnapshot.rotX2[entity] = bodyState.rotX;
  RemoteSnapshot.rotY2[entity] = bodyState.rotY;
  RemoteSnapshot.rotZ2[entity] = bodyState.rotZ;
  RemoteSnapshot.rotW2[entity] = bodyState.rotW;

  Body.grounded[entity] = bodyState.grounded;
}

export function sendStructuralUpdates(
  state: State,
  netState: NetworkState,
  room: Room,
  clientAuthorityEntities: number[]
): void {
  const networkedComponentNames = state.getNetworkedComponentNames();

  for (const entity of clientAuthorityEntities) {
    if (netState.initializedEntities.has(entity)) continue;

    const networkId = NetworkIdentity.networkId[entity];
    if (networkId === 0) {
      if (netState.pendingNetworkIdRequests.has(entity)) continue;
      netState.pendingNetworkIdRequests.add(entity);
      room.send('request-network-id', { localEntity: entity });
      continue;
    }

    const components: Record<string, Record<string, number>> = {};

    for (const componentName of networkedComponentNames) {
      const Component = state.getComponent(componentName);
      if (!Component) continue;

      if (!state.hasComponent(entity, Component)) continue;

      const serialized = serializeComponent(Component, entity);
      components[componentName] = serialized;
    }

    room.send(NetworkMessages.STRUCTURAL_UPDATE, {
      networkId,
      components,
    });

    netState.initializedEntities.add(entity);
  }
}
