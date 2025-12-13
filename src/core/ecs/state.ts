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
import { ComponentRegistry } from './component-registry';
import { ConfigRegistry } from './config';
import { EntityRegistry } from './entity-registry';
import { RecipeRegistry } from './recipe-registry';
import { SystemRegistry } from './system-registry';
import { setComponentFields } from './utils';
import { Parent } from './components';
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
import { createEntityFromRecipe } from '../recipes/parser';

export class State {
  public readonly world: IWorld;
  public readonly time: GameTime;
  public readonly scheduler = new Scheduler();
  public readonly config = new ConfigRegistry();
  public headless = false;
  private readonly componentRegistry = new ComponentRegistry();
  private readonly entityRegistry = new EntityRegistry();
  private readonly recipeRegistry = new RecipeRegistry();
  private readonly systemRegistry = new SystemRegistry();
  private readonly plugins: Plugin[] = [];
  private isDisposed = false;

  /**
   * Get all registered systems as a ReadonlySet for compatibility with Scheduler.
   * Supports state.systems.size and Array.from(state.systems).
   */
  get systems(): ReadonlySet<System> {
    return this.systemRegistry.getSystems();
  }

  constructor(options?: { headless?: boolean }) {
    this.world = createWorld();
    this.time = {
      deltaTime: 0,
      fixedDeltaTime: TIME_CONSTANTS.FIXED_TIMESTEP,
      elapsed: 0,
    };
    this.headless = options?.headless ?? false;

    this.registerComponent('parent', Parent);
    this.registerRecipe({
      name: 'entity',
      components: [],
    });
  }

  registerPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
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

  async initializePlugins(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.initialize) {
        await plugin.initialize(this);
      }
    }
  }

  registerSystem(system: System): void {
    this.systemRegistry.add(system);
  }

  registerRecipe(recipe: Recipe): void {
    this.recipeRegistry.register(recipe);
  }

  registerComponent(name: string, component: Component): void {
    this.componentRegistry.register(name, component);
  }

  registerConfig(config: Config): void {
    this.config.register(config);
  }

  getParser(tag: string): Parser | undefined {
    return this.config.getParser(tag);
  }

  getRecipe(name: string): Recipe | undefined {
    return this.recipeRegistry.get(name);
  }

  getComponent(name: string): Component | undefined {
    return this.componentRegistry.get(name);
  }

  hasRecipe(name: string): boolean {
    return this.recipeRegistry.has(name);
  }

  getRecipeNames(): Set<string> {
    return this.recipeRegistry.getNames();
  }

  getComponentNames(): string[] {
    return this.componentRegistry.getNames();
  }

  setEntityName(name: string, entity: number): void {
    this.entityRegistry.setName(name, entity);
  }

  getEntityByName(name: string): number | null {
    return this.entityRegistry.getByName(name);
  }

  getEntityName(eid: number): string | undefined {
    return this.entityRegistry.getName(eid);
  }

  getNamedEntities(): Map<string, number> {
    return this.entityRegistry.getAll();
  }

  private getComponentName(component: Component): string | undefined {
    return this.componentRegistry.getName(component);
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
    this.systemRegistry.clear();
    this.isDisposed = true;
  }

  private checkDisposed(): void {
    if (this.isDisposed) {
      throw new Error('[VibeGame] Cannot use disposed State');
    }
  }
}
