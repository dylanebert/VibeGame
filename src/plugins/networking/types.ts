import type { Room } from 'colyseus.js';

export interface NetworkState {
  room?: Room;
  sessionId?: string;
  networkIdToEntity: Map<number, number>;
  entityToNetworkId: Map<number, number>;
  initializedEntities: Set<number>;
  remoteEntities: Set<number>;
  pendingNetworkIdRequests: Set<number>;
}

export interface BodyStateLike {
  tick?: number;
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  rotW: number;
  grounded: number;
}

export interface StructuralUpdate {
  networkId: number;
  components: Record<string, Record<string, number>>;
}
