export {
  ServerBuilder,
  createServer,
  type ServerOptions,
  type GameServer,
} from './builder';
export { GameRoom, type GameRoomOptions } from './room';

import type { Plugin, System, Component, Config, Recipe } from '../core';
import { ServerBuilder, type ServerOptions } from './builder';

let globalBuilder: ServerBuilder | null = null;

function getBuilder(): ServerBuilder {
  if (!globalBuilder) {
    globalBuilder = new ServerBuilder();
  }
  return globalBuilder;
}

export function resetBuilder(): void {
  globalBuilder = null;
}

export function withPlugin(plugin: Plugin) {
  return getBuilder().withPlugin(plugin);
}

export function withPlugins(...plugins: Plugin[]) {
  return getBuilder().withPlugins(...plugins);
}

export function withSystem(system: System) {
  return getBuilder().withSystem(system);
}

export function withSystems(...systems: System[]) {
  return getBuilder().withSystems(...systems);
}

export function withComponent(name: string, component: Component) {
  return getBuilder().withComponent(name, component);
}

export function withRecipe(recipe: Recipe) {
  return getBuilder().withRecipe(recipe);
}

export function withConfig(config: Config) {
  return getBuilder().withConfig(config);
}

export function configure(options: ServerOptions) {
  return getBuilder().configure(options);
}

export function run(options?: ServerOptions) {
  const builder = options ? new ServerBuilder(options) : getBuilder();
  globalBuilder = null;
  return builder.run();
}
