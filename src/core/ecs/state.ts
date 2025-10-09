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
import { createEntityFromRecipe } from '../recipes/parser';
import { toKebabCase } from '../utils/naming';
import { Parent } from './components';
import { ConfigRegistry } from './config';
import { TIME_CONSTANTS } from './constants';
import { Scheduler } from './scheduler';
import type {
  Config,
  GameTime,
  Parser,
  Plugin,
  Recipe,
  System,
  XMLValue,
} from './types';
import { setComponentFields } from './utils';

export class State {
  public readonly world: IWorld;
  public readonly time: GameTime;
  public readonly scheduler = new Scheduler();
  public readonly systems = new Set<System>();
  public readonly config = new ConfigRegistry();
  public readonly mode: 'client' | 'server';
  private readonly recipes = new Map<string, Recipe>();
  private readonly components = new Map<string, Component>();
  private readonly networked = new Set<string>();
  private isDisposed = false;

  constructor(mode?: 'client' | 'server') {
    this.mode = mode ?? 'client';
    this.world = createWorld();
    this.time = {
      deltaTime: 0,
      fixedDeltaTime: TIME_CONSTANTS.FIXED_TIMESTEP,
      elapsed: 0,
      tick: 0,
    };

    this.registerComponent('parent', Parent);
    this.registerRecipe({
      name: 'entity',
      components: [],
    });
  }

  get isServer(): boolean {
    return this.mode === 'server';
  }

  get isClient(): boolean {
    return this.mode === 'client';
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
    if (plugin.networked) {
      for (const component of plugin.networked) {
        const componentName = this.getComponentName(component);
        if (componentName) {
          this.networked.add(componentName);
        }
      }
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

  getNetworkedComponentNames(): string[] {
    return Array.from(this.networked);
  }

  private getComponentName(component: Component): string | undefined {
    for (const [name, comp] of this.components.entries()) {
      if (comp === component) {
        return name;
      }
    }
    return undefined;
  }

  step(deltaTime = TIME_CONSTANTS.DEFAULT_DELTA): void {
    this.checkDisposed();
    this.scheduler.step(this, deltaTime);
  }

  createEntity(): number {
    this.checkDisposed();
    return addEntity(this.world);
  }

  destroyEntity(eid: number): void {
    this.checkDisposed();
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

    const componentName = this.getComponentName(component);
    if (componentName) {
      const defaults = this.config.getDefaults(componentName);
      setComponentFields(component, eid, defaults);
    }

    if (values) {
      setComponentFields(component, eid, values);
    }
  }

  removeComponent<T extends Component>(eid: number, component: T): void {
    removeComponent(this.world, component, eid);
  }

  hasComponent<T extends Component>(eid: number, component: T): boolean {
    return hasComponent(this.world, component, eid);
  }

  createFromRecipe(
    recipeName: string,
    attributes: Record<string, XMLValue> = {}
  ): number {
    return createEntityFromRecipe(this, recipeName, attributes);
  }

  dispose(): void {
    if (this.isDisposed) {
      throw new Error('[VibeGame] State already disposed');
    }
    for (const system of this.systems) {
      system.dispose?.(this);
    }
    this.systems.clear();
    this.isDisposed = true;
  }

  private checkDisposed(): void {
    if (this.isDisposed) {
      throw new Error('[VibeGame] Cannot use disposed State');
    }
  }
}
