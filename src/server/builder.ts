import type { Component, Config, Plugin, Recipe, System } from '../core';
import { State } from '../core';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GameRoom } from './room';

export interface ServerOptions {
  port?: number;
  tickRate?: number;
}

export interface GameServer {
  server: Server;
  port: number;
  stop: () => Promise<void>;
}

export class ServerBuilder {
  private state: State;
  private options: ServerOptions;
  private plugins: Plugin[] = [];
  private systems: System[] = [];
  private components: Map<string, Component> = new Map();
  private recipes: Recipe[] = [];
  private configs: Config[] = [];

  constructor(options: ServerOptions = {}) {
    this.state = new State({ context: 'server' });
    this.options = options;
  }

  withPlugin(plugin: Plugin): ServerBuilder {
    this.plugins.push(plugin);
    return this;
  }

  withPlugins(...plugins: Plugin[]): ServerBuilder {
    this.plugins.push(...plugins);
    return this;
  }

  withSystem(system: System): ServerBuilder {
    this.systems.push(system);
    return this;
  }

  withSystems(...systems: System[]): ServerBuilder {
    this.systems.push(...systems);
    return this;
  }

  withComponent(name: string, component: Component): ServerBuilder {
    this.components.set(name, component);
    return this;
  }

  withRecipe(recipe: Recipe): ServerBuilder {
    this.recipes.push(recipe);
    return this;
  }

  withConfig(config: Config): ServerBuilder {
    this.configs.push(config);
    return this;
  }

  configure(options: ServerOptions): ServerBuilder {
    this.options = { ...this.options, ...options };
    return this;
  }

  build(): typeof GameRoom {
    for (const plugin of this.plugins) {
      this.state.registerPlugin(plugin);
    }

    for (const system of this.systems) {
      this.state.registerSystem(system);
    }

    for (const [name, component] of this.components) {
      this.state.registerComponent(name, component);
    }

    for (const recipe of this.recipes) {
      this.state.registerRecipe(recipe);
    }

    for (const config of this.configs) {
      this.state.registerConfig(config);
    }

    return GameRoom.createWithState(this.state);
  }

  async run(): Promise<GameServer> {
    const port = this.options.port ?? 2567;
    const RoomClass = this.build();

    const gameServer = new Server({
      transport: new WebSocketTransport({}),
    });

    gameServer.define('game', RoomClass);

    await gameServer.listen(port);

    console.log(`[Server] Listening on ws://localhost:${port}`);

    return {
      server: gameServer,
      port,
      stop: async () => {
        await gameServer.gracefullyShutdown();
      },
    };
  }
}

export function createServer(options?: ServerOptions): ServerBuilder {
  return new ServerBuilder(options);
}
