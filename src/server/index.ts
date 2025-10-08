import { Server } from 'colyseus';
import { createServer } from 'http';
import { GameRoom } from './game-room';

export interface ServerOptions {
  port?: number;
}

export function createGameServer(options: ServerOptions = {}): Server {
  const port = options.port ?? 2567;

  const gameServer = new Server({
    server: createServer(),
  });

  gameServer.define('game', GameRoom);
  gameServer.listen(port);

  console.log(`[Server] Listening on ws://localhost:${port}`);

  return gameServer;
}

export { GameRoom } from './game-room';
export { BodyState, GameState } from './schemas';
export type { PositionSnapshot } from './utils';
