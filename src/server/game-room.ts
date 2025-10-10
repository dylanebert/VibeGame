import { Client, Room } from 'colyseus';
import { JSDOM } from 'jsdom';
import { defineQuery, TIME_CONSTANTS, XMLParser } from '../core';
import { State } from '../core/ecs/state';
import { deserializeComponent } from '../core/ecs/serialization';
import { parseXMLToEntities } from '../core/recipes/parser';
import type { EntityCreationResult } from '../core/recipes/types';
import { NetworkIdentity, ServerAuthority } from '../plugins/networking';
import { Body } from '../plugins/physics';
import { initializePhysics } from '../plugins/physics/systems';
import { ServerPlugins } from './plugins';
import { BodyState, GameState, StructuralState } from './schemas';
import type { PositionSnapshot } from './utils';
import {
  isValidSnapshot,
  normalizeQuaternion,
  sanitizeNumber,
  serializeEntityComponents,
} from './utils';

const serverEntityQuery = defineQuery([NetworkIdentity, ServerAuthority, Body]);

let configuredWorldXML: string | undefined;

export function setWorldXML(worldXML: string): void {
  configuredWorldXML = worldXML;
}

export interface GameRoomOptions {
  worldXML?: string;
}

export class GameRoom extends Room<GameState> {
  private serverState?: State;
  private serverTick = 0;
  private nextNetworkId = 1;
  private networkIdToEntity = new Map<number, number>();

  async onCreate() {
    this.state = new GameState();
    console.log('[Server] GameRoom created');

    await initializePhysics();
    this.serverState = new State('server');
    for (const plugin of ServerPlugins) {
      this.serverState.registerPlugin(plugin);
    }
    console.log('[Server] Physics initialized');

    if (configuredWorldXML) {
      this.initializeWorld(configuredWorldXML);
    }

    this.setSimulationInterval((deltaTime) => {
      this.serverState?.step(deltaTime / 1000);
      this.serverTick++;

      if (this.serverState) {
        const serverEntities = serverEntityQuery(this.serverState.world);
        for (const entity of serverEntities) {
          const networkId = NetworkIdentity.networkId[entity];
          if (networkId === 0) continue;

          const key = networkId.toString();
          let bodyState = this.state.bodies.get(key);

          if (!bodyState) {
            bodyState = new BodyState();
            bodyState.networkId = networkId;
            bodyState.owner = 'server';
            this.state.bodies.set(key, bodyState);
          }

          bodyState.posX = Body.posX[entity];
          bodyState.posY = Body.posY[entity];
          bodyState.posZ = Body.posZ[entity];
          bodyState.rotX = Body.rotX[entity];
          bodyState.rotY = Body.rotY[entity];
          bodyState.rotZ = Body.rotZ[entity];
          bodyState.rotW = Body.rotW[entity];
          bodyState.tick = this.serverTick;
          bodyState.grounded = Body.grounded[entity];
        }
      }
    }, TIME_CONSTANTS.FIXED_TIMESTEP * 1000);

    this.onMessage(
      'request-network-id',
      (client, data: { localEntity: number }) => {
        const networkId = this.nextNetworkId++;
        console.log(
          `[Server] Assigned network ID ${networkId} to client ${client.sessionId} localEntity ${data.localEntity}`
        );
        client.send('network-id-assigned', {
          localEntity: data.localEntity,
          networkId,
        });
      }
    );

    this.onMessage('position', (client, snapshot: PositionSnapshot) => {
      if (!isValidSnapshot(snapshot)) {
        console.warn(
          `[Server] Invalid snapshot from ${client.sessionId}:`,
          snapshot
        );
        return;
      }

      const networkId = snapshot.networkId;
      if (!networkId) {
        console.warn('[Server] Position snapshot missing networkId');
        return;
      }

      const key = networkId.toString();
      let body = this.state.bodies.get(key);

      if (!body) {
        body = new BodyState();
        body.networkId = networkId;
        body.owner = client.sessionId;
        this.state.bodies.set(key, body);
        console.log(
          `[Server] Created body state for network ID ${networkId}, owner: ${client.sessionId}`
        );
      }

      body.posX = sanitizeNumber(snapshot.posX);
      body.posY = sanitizeNumber(snapshot.posY);
      body.posZ = sanitizeNumber(snapshot.posZ);

      const normalized = normalizeQuaternion({
        x: snapshot.rotX,
        y: snapshot.rotY,
        z: snapshot.rotZ,
        w: snapshot.rotW,
      });

      body.rotX = normalized.x;
      body.rotY = normalized.y;
      body.rotZ = normalized.z;
      body.rotW = normalized.w;
      body.tick = this.serverTick;

      if (snapshot.grounded !== undefined) {
        body.grounded = sanitizeNumber(snapshot.grounded);
      }
    });

    this.onMessage(
      'structural',
      (
        client,
        data: {
          networkId: number;
          components: Record<string, Record<string, number>>;
        }
      ) => {
        const key = data.networkId.toString();
        let structural = this.state.structures.get(key);

        if (!structural) {
          structural = new StructuralState();
          structural.networkId = data.networkId;
          structural.owner = client.sessionId;
          this.state.structures.set(key, structural);
          console.log(
            `[Server] Client-owned structural update: network ID ${data.networkId}, owner: ${client.sessionId}`
          );
        }

        structural.data = JSON.stringify({
          networkId: data.networkId,
          components: data.components,
        });
      }
    );
  }

  onJoin(client: Client) {
    console.log(`[Server] Session joined: ${client.sessionId}`);
  }

  onLeave(client: Client) {
    const toRemove: string[] = [];

    this.state.bodies.forEach((body, key) => {
      if (body.owner === client.sessionId) {
        toRemove.push(key);
      }
    });

    for (const key of toRemove) {
      this.state.bodies.delete(key);
    }

    const toRemoveStructural: string[] = [];
    this.state.structures.forEach((structural, key) => {
      if (structural.owner === client.sessionId) {
        toRemoveStructural.push(key);
      }
    });

    for (const key of toRemoveStructural) {
      this.state.structures.delete(key);
    }

    console.log(`[Server] Session left: ${client.sessionId}`);
  }

  onDispose() {
    this.serverState?.dispose();
    console.log('[Server] GameRoom disposed');
  }

  private createServerEntity(
    components: Record<string, Record<string, number>>
  ): number {
    if (!this.serverState) return 0;

    const entity = this.serverState.createEntity();
    const networkId = this.nextNetworkId++;

    this.networkIdToEntity.set(networkId, entity);

    this.serverState.addComponent(entity, NetworkIdentity);
    NetworkIdentity.networkId[entity] = networkId;

    this.serverState.addComponent(entity, ServerAuthority);

    for (const [componentName, componentData] of Object.entries(components)) {
      const Component = this.serverState.getComponent(componentName);
      if (!Component) {
        console.warn(`[Server] Unknown component: ${componentName}`);
        continue;
      }

      if (!this.serverState.hasComponent(entity, Component)) {
        this.serverState.addComponent(entity, Component);
      }

      if (Object.keys(componentData as Record<string, number>).length > 0) {
        deserializeComponent(
          Component,
          entity,
          componentData as Record<string, number>
        );
      }
    }

    const key = networkId.toString();
    const structural = new StructuralState();
    structural.networkId = networkId;
    structural.owner = 'server';
    structural.data = JSON.stringify({
      networkId,
      components,
    });
    this.state.structures.set(key, structural);

    return entity;
  }

  spawnServerEntity(
    components: Record<string, Record<string, number>>
  ): number {
    return this.createServerEntity(components);
  }

  private initializeWorld(worldHTML: string): void {
    if (!this.serverState) {
      console.error('[Server] Cannot initialize world: serverState not ready');
      return;
    }

    if (typeof DOMParser === 'undefined') {
      const dom = new JSDOM();
      (
        global as typeof globalThis & { DOMParser: typeof dom.window.DOMParser }
      ).DOMParser = dom.window.DOMParser;
    }

    try {
      const dom = new JSDOM(worldHTML);
      const worldElement = dom.window.document.querySelector('world');

      if (!worldElement) {
        console.error('[Server] No <world> element found in HTML');
        return;
      }

      const worldContent = worldElement.innerHTML;
      const xmlContent = `<world>${worldContent}</world>`;

      const parsedXML = XMLParser.parse(xmlContent);
      const entities = parseXMLToEntities(this.serverState, parsedXML.root);

      let entityCount = 0;
      const markEntities = (results: EntityCreationResult[]) => {
        for (const result of results) {
          this.markAsServerEntity(result.entity);
          entityCount++;
          if (result.children.length > 0) {
            markEntities(result.children);
          }
        }
      };

      markEntities(entities);
      console.log(`[Server] Initialized world with ${entityCount} entities`);
    } catch (error) {
      console.error('[Server] Failed to initialize world from HTML:', error);
    }
  }

  private markAsServerEntity(entity: number): void {
    if (!this.serverState) return;

    const networkId = this.nextNetworkId++;
    this.networkIdToEntity.set(networkId, entity);

    this.serverState.addComponent(entity, NetworkIdentity);
    NetworkIdentity.networkId[entity] = networkId;

    this.serverState.addComponent(entity, ServerAuthority);

    const components = serializeEntityComponents(entity, this.serverState);
    const key = networkId.toString();
    const structural = new StructuralState();
    structural.networkId = networkId;
    structural.owner = 'server';
    structural.data = JSON.stringify({
      networkId,
      components,
    });
    this.state.structures.set(key, structural);
  }
}
