import { Client, Room } from 'colyseus';
import { makeCompositeKey } from './composite-key';
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

      const compositeKey = makeCompositeKey(client.sessionId, snapshot.entity);
      let body = this.state.bodies.get(compositeKey);

      if (!body) {
        body = new BodyState();
        this.state.bodies.set(compositeKey, body);
        console.log(`[Server] Entity created: ${compositeKey}`);
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
    console.log(`[Server] Session joined: ${client.sessionId}`);
  }

  onLeave(client: Client) {
    const toRemove: string[] = [];
    const prefix = client.sessionId + ':';

    this.state.bodies.forEach((_body, key) => {
      if (key.startsWith(prefix)) {
        toRemove.push(key);
      }
    });

    for (const key of toRemove) {
      this.state.bodies.delete(key);
      console.log(`[Server] Entity removed: ${key}`);
    }

    console.log(`[Server] Session left: ${client.sessionId}`);
  }

  onDispose() {
    console.log('[Server] GameRoom disposed');
  }
}
