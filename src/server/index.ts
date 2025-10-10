import { Server } from 'colyseus';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { GameRoom, setWorldXML } from './game-room';

export interface ServerOptions {
  port?: number;
  worldXML?: string;
  worldFile?: string;
}

export function createGameServer(options: ServerOptions = {}): Server {
  const port = options.port ?? 2567;

  let worldXML = options.worldXML;
  if (options.worldFile && !worldXML) {
    try {
      worldXML = readFileSync(options.worldFile, 'utf-8');
      console.log(`[Server] Loaded world from file: ${options.worldFile}`);
    } catch (error) {
      console.error(
        `[Server] Failed to load world file: ${options.worldFile}`,
        error
      );
    }
  }

  if (worldXML) {
    setWorldXML(worldXML);
  }

  const gameServer = new Server({
    server: createServer(),
  });

  gameServer.define('game', GameRoom);
  gameServer.listen(port);

  console.log(`[Server] Listening on ws://localhost:${port}`);

  return gameServer;
}

export { GameRoom } from './game-room';
export type { GameRoomOptions } from './game-room';
export { ServerPlugins } from './plugins';
export { BodyState, GameState } from './schemas';
export type { PositionSnapshot } from './utils';
