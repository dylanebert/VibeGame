import type { BuilderOptions } from './builder';
import { GameBuilder } from './builder';
import type { Component, Plugin, System } from './core';
import { disposeAllRuntimes } from './core/runtime-manager';

export * from './core';
export type { BuilderOptions };
export type { GameRuntime } from './runtime';

let globalBuilder: GameBuilder | null = null;

function getBuilder(): GameBuilder {
  if (!globalBuilder) {
    globalBuilder = new GameBuilder();
  }
  return globalBuilder;
}

export function resetBuilder(): void {
  disposeAllRuntimes();
  globalBuilder = null;
}

export function withPlugin(plugin: Plugin) {
  return getBuilder().withPlugin(plugin);
}

export function withPlugins(...plugins: Plugin[]) {
  return getBuilder().withPlugins(...plugins);
}

export function withoutDefaultPlugins() {
  return getBuilder().withoutDefaultPlugins();
}

export function withoutPlugins(...plugins: Plugin[]) {
  return getBuilder().withoutPlugins(...plugins);
}

export function withSystem(system: System) {
  return getBuilder().withSystem(system);
}

export function withComponent(name: string, component: Component) {
  return getBuilder().withComponent(name, component);
}

export function configure(options: BuilderOptions) {
  return getBuilder().configure(options);
}

export async function run() {
  const builder = getBuilder();
  disposeAllRuntimes();
  globalBuilder = null;
  return builder.run();
}
