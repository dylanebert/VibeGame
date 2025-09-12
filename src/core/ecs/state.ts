import {
  addComponent,
  addEntity,
  createWorld,
  entityExists,
  hasComponent,
  removeComponent,
  removeEntity,
  type Component,
  type IWorld,
} from 'bitecs';
import { toKebabCase } from '../utils/naming';
import { ConfigRegistry } from './config';
import { TIME_CONSTANTS } from './constants';
import { Scheduler } from './scheduler';
import type { Config, GameTime, Parser, Plugin, Recipe, System } from './types';

export class State {
  public readonly world: IWorld;
  public readonly time: GameTime;
  public readonly scheduler = new Scheduler();
  public readonly systems = new Set<System>();
  public readonly config = new ConfigRegistry();
  private readonly recipes = new Map<string, Recipe>();
  private readonly components = new Map<string, Component>();

  constructor() {
    this.world = createWorld();
    this.time = {
      deltaTime: 0,
      fixedDeltaTime: TIME_CONSTANTS.FIXED_TIMESTEP,
      elapsed: 0,
    };
  }

  registerPlugin(plugin: Plugin): void {
    if (plugin.components) {
      for (const [name, component] of Object.entries(plugin.components)) {
        this.registerComponent(name, component);
      }
    }
    if (plugin.systems) {
      for (const system of plugin.systems) {
        this.registerSystem(system);
      }
    }
    if (plugin.recipes) {
      for (const recipe of plugin.recipes) {
        this.registerRecipe(recipe);
      }
    }
    if (plugin.config) {
      this.registerConfig(plugin.config);
    }
  }

  registerSystem(system: System): void {
    if (!this.systems.has(system)) {
      this.systems.add(system);
    }
  }

  registerRecipe(recipe: Recipe): void {
    this.recipes.set(recipe.name, recipe);
  }

  registerComponent(name: string, component: Component): void {
    const kebabName = toKebabCase(name);
    this.components.set(kebabName, component);
  }

  registerConfig(config: Config): void {
    this.config.register(config);
  }

  getParser(tag: string): Parser | undefined {
    return this.config.getParser(tag);
  }

  getRecipe(name: string): Recipe | undefined {
    return this.recipes.get(name);
  }

  getComponent(name: string): Component | undefined {
    return this.components.get(toKebabCase(name));
  }

  hasRecipe(name: string): boolean {
    return this.recipes.has(name);
  }

  getRecipeNames(): Set<string> {
    return new Set(this.recipes.keys());
  }

  getComponentNames(): string[] {
    return Array.from(this.components.keys());
  }

  step(deltaTime = TIME_CONSTANTS.DEFAULT_DELTA): void {
    this.scheduler.step(this, deltaTime);
  }

  createEntity(): number {
    return addEntity(this.world);
  }

  destroyEntity(eid: number): void {
    removeEntity(this.world, eid);
  }

  exists(eid: number): boolean {
    return entityExists(this.world, eid);
  }

  addComponent<T extends Component>(
    eid: number,
    component: T,
    values?: Record<string, number>
  ): void {
    addComponent(this.world, component, eid);
    if (values) {
      for (const [key, value] of Object.entries(values)) {
        const field = component[key as keyof T] as
          | Float32Array
          | Int32Array
          | Uint8Array
          | Uint16Array
          | Uint32Array
          | undefined;
        if (field) {
          field[eid] = value;
        }
      }
    }
  }

  removeComponent<T extends Component>(eid: number, component: T): void {
    removeComponent(this.world, component, eid);
  }

  hasComponent<T extends Component>(eid: number, component: T): boolean {
    return hasComponent(this.world, component, eid);
  }

  dispose(): void {
    for (const system of this.systems) {
      system.dispose?.(this);
    }
    this.systems.clear();
  }
}
