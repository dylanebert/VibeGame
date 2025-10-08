import type { Room } from 'colyseus.js';

export interface NetworkState {
  room?: Room;
  sessionId?: string;
  compositeKeyToEntity: Map<string, number>;
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
}
