import type { Component } from 'bitecs';
import { toKebabCase } from '../utils/naming';

export class ComponentRegistry {
  private readonly nameToComponent = new Map<string, Component>();
  private readonly componentToName = new Map<Component, string>();

  register(name: string, component: Component): void {
    const kebabName = toKebabCase(name);

    const existing = this.nameToComponent.get(kebabName);
    if (existing) {
      this.componentToName.delete(existing);
    }

    this.nameToComponent.set(kebabName, component);
    this.componentToName.set(component, kebabName);
  }

  get(name: string): Component | undefined {
    return this.nameToComponent.get(toKebabCase(name));
  }

  getName(component: Component): string | undefined {
    return this.componentToName.get(component);
  }

  getNames(): string[] {
    return Array.from(this.nameToComponent.keys());
  }
}
