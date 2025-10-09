import type { Room } from 'colyseus.js';
import type { State } from '../../core';
import {
  deserializeComponent,
  serializeComponent,
} from '../../core/ecs/serialization';
import { Body, BodyType } from '../physics';
import { Networked } from './components';
import { NetworkMessages } from './constants';
import type { BodyStateLike, NetworkState, StructuralUpdate } from './types';
import { hashString } from './utils';

export function handleIncomingStructuralUpdate(
  state: State,
  netState: NetworkState,
  data: StructuralUpdate
): void {
  const compositeKey = `${data.sessionId}:${data.entity}`;
  let entity = netState.compositeKeyToEntity.get(compositeKey);

  if (!entity) {
    entity = state.createEntity();
    netState.compositeKeyToEntity.set(compositeKey, entity);
    netState.remoteEntities.add(compositeKey);

    state.addComponent(entity, Networked);
    Networked.sessionId[entity] = hashString(compositeKey);
    initializeSnapshotBuffer(entity);

    state.addComponent(entity, Body);
    Body.type[entity] = BodyType.KinematicPositionBased;

    console.log(
      `[Network] Remote entity spawned: ${compositeKey} → entity ${entity}`
    );
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

    console.log(
      `[Network] Applied component ${componentName} to entity ${entity}`
    );
  }

  if (state.hasComponent(entity, Body)) {
    Body.type[entity] = BodyType.KinematicPositionBased;
  }
}

function initializeSnapshotBuffer(entity: number): void {
  Networked.tick0[entity] = 0;
  Networked.posX0[entity] = 0;
  Networked.posY0[entity] = 0;
  Networked.posZ0[entity] = 0;
  Networked.rotX0[entity] = 0;
  Networked.rotY0[entity] = 0;
  Networked.rotZ0[entity] = 0;
  Networked.rotW0[entity] = 1;

  Networked.tick1[entity] = 0;
  Networked.posX1[entity] = 0;
  Networked.posY1[entity] = 0;
  Networked.posZ1[entity] = 0;
  Networked.rotX1[entity] = 0;
  Networked.rotY1[entity] = 0;
  Networked.rotZ1[entity] = 0;
  Networked.rotW1[entity] = 1;

  Networked.tick2[entity] = 0;
  Networked.posX2[entity] = 0;
  Networked.posY2[entity] = 0;
  Networked.posZ2[entity] = 0;
  Networked.rotX2[entity] = 0;
  Networked.rotY2[entity] = 0;
  Networked.rotZ2[entity] = 0;
  Networked.rotW2[entity] = 1;
}

export function syncRemoteBody(
  _state: State,
  compositeKey: string,
  bodyState: BodyStateLike,
  netState: NetworkState
): void {
  const entity = netState.compositeKeyToEntity.get(compositeKey);

  if (!entity) {
    console.debug(
      `[Network] Received body update for unknown entity: ${compositeKey}. Waiting for structural update.`
    );
    return;
  }

  const serverTick = bodyState.tick ?? 0;
  const latestTick = Networked.tick2[entity];

  if (serverTick <= latestTick) return;

  insertSnapshotIntoBuffer(entity, bodyState, serverTick);
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

const NETWORKED_COMPONENTS = ['body', 'renderer'];

export function sendStructuralUpdates(
  state: State,
  netState: NetworkState,
  room: Room,
  ownedEntities: number[]
): void {
  for (const entity of ownedEntities) {
    if (netState.initializedEntities.has(entity)) continue;

    const components: Record<string, Record<string, number>> = {};

    for (const componentName of NETWORKED_COMPONENTS) {
      const Component = state.getComponent(componentName);
      if (!Component) continue;

      if (!state.hasComponent(entity, Component)) continue;

      const serialized = serializeComponent(Component, entity);
      components[componentName] = serialized;
    }

    room.send(NetworkMessages.STRUCTURAL_UPDATE, {
      entity,
      components,
    });

    netState.initializedEntities.add(entity);

    console.log(
      `[Network] Sent structural update for entity ${entity} with components:`,
      Object.keys(components)
    );
  }
}
