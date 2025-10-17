import type {
  Component,
  Config,
  Plugin,
  Recipe,
  StateOptions,
  System,
} from './core';
import { State } from './core';
import { DefaultPlugins } from './plugins/defaults';
import { GameRuntime } from './runtime';

export interface BuilderOptions {
  canvas?: string;
  autoStart?: boolean;
  dom?: boolean;
}

export class GameBuilder {
  private state: State | null = null;
  private options: BuilderOptions;
  private stateOptions: StateOptions;
  private useDefaultPlugins = true;
  private excludedPlugins: Set<Plugin> = new Set();
  private plugins: Plugin[] = [];
  private systems: System[] = [];
  private components: Map<string, Component> = new Map();
  private recipes: Recipe[] = [];
  private configs: Config[] = [];

  constructor(options: BuilderOptions = {}, stateOptions: StateOptions = {}) {
    this.options = options;
    this.stateOptions = stateOptions;
  }

  withoutDefaultPlugins(): GameBuilder {
    this.useDefaultPlugins = false;
    return this;
  }

  withoutPlugins(...plugins: Plugin[]): GameBuilder {
    for (const plugin of plugins) {
      this.excludedPlugins.add(plugin);
    }
    return this;
  }

  withPlugin(plugin: Plugin): GameBuilder {
    this.plugins.push(plugin);
    return this;
  }

  withPlugins(...plugins: Plugin[]): GameBuilder {
    this.plugins.push(...plugins);
    return this;
  }

  withSystem(system: System): GameBuilder {
    this.systems.push(system);
    return this;
  }

  withSystems(...systems: System[]): GameBuilder {
    this.systems.push(...systems);
    return this;
  }

  withComponent(name: string, component: Component): GameBuilder {
    this.components.set(name, component);
    return this;
  }

  withRecipe(recipe: Recipe): GameBuilder {
    this.recipes.push(recipe);
    return this;
  }

  withConfig(config: Config): GameBuilder {
    this.configs.push(config);
    return this;
  }

  configure(options: BuilderOptions): GameBuilder {
    this.options = { ...this.options, ...options };
    return this;
  }

  async build(): Promise<GameRuntime> {
    this.state = new State(this.stateOptions);

    if (this.useDefaultPlugins) {
      for (const plugin of DefaultPlugins) {
        if (!this.excludedPlugins.has(plugin)) {
          this.state.registerPlugin(plugin);
        }
      }
    }

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

    return new GameRuntime(this.state, this.options);
  }

  async run(): Promise<GameRuntime> {
    const runtime = await this.build();
    await runtime.start();
    return runtime;
  }
}
