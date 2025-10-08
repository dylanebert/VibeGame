import { Client, Room } from 'colyseus';
import { BodyState, GameState } from './schemas';
import type { PositionSnapshot } from './utils';
import { isValidSnapshot, normalizeQuaternion, sanitizeNumber } from './utils';

export class GameRoom extends Room<GameState> {
  private serverTick = 0;

  onCreate() {
    this.state = new GameState();
    console.log('[Server] GameRoom created');

    this.setSimulationInterval(() => {
      this.serverTick++;
    });

    this.onMessage('position', (client, snapshot: PositionSnapshot) => {
      if (!isValidSnapshot(snapshot)) {
        console.warn(
          `[Server] Invalid snapshot from ${client.sessionId}:`,
          snapshot
        );
        return;
      }

      const body = this.state.bodies.get(client.sessionId);
      if (!body) {
        console.warn(
          `[Server] Position update from unknown session ${client.sessionId}`
        );
        return;
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
    });
  }

  onJoin(client: Client) {
    const bodyState = new BodyState();
    bodyState.posX = 0;
    bodyState.posY = 2;
    bodyState.posZ = 0;
    bodyState.rotX = 0;
    bodyState.rotY = 0;
    bodyState.rotZ = 0;
    bodyState.rotW = 1;

    this.state.bodies.set(client.sessionId, bodyState);
    console.log(`[Server] Session joined: ${client.sessionId}`);
  }

  onLeave(client: Client) {
    this.state.bodies.delete(client.sessionId);
    console.log(`[Server] Session left: ${client.sessionId}`);
  }

  onDispose() {
    console.log('[Server] GameRoom disposed');
  }
}
