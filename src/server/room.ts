import { Room, Client } from 'colyseus';
import { State } from '../core';

export interface GameRoomOptions {
  state: State;
  tickRate?: number;
}

export class GameRoom extends Room {
  private gameState!: State;

  static createWithState(state: State): typeof GameRoom {
    const ConfiguredRoom = class extends GameRoom {
      constructor() {
        super();
        this.gameState = state;
      }
    };
    return ConfiguredRoom;
  }

  onCreate() {
    this.setSimulationInterval((deltaTime) => this.update(deltaTime));
  }

  onJoin(client: Client) {
    console.log(`[Server] Client ${client.sessionId} joined`);
  }

  onLeave(client: Client) {
    console.log(`[Server] Client ${client.sessionId} left`);
  }

  onDispose() {
    if (!this.gameState.disposed()) {
      this.gameState.dispose();
    }
  }

  private update(deltaTime: number) {
    if (!this.gameState.disposed()) {
      this.gameState.step(deltaTime / 1000);
    }
  }
}
