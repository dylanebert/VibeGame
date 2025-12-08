import type { State } from '../ecs/state';

export interface ParseContextOptions {
  ignoreUnknownAttributes?: string[];
}

export class ParseContext {
  private ignoreSet: Set<string>;

  constructor(
    private state: State,
    options?: ParseContextOptions
  ) {
    this.ignoreSet = new Set(options?.ignoreUnknownAttributes ?? []);
  }

  setName(name: string, entity: number): void {
    this.state.setEntityName(name, entity);
  }

  getEntityByName(name: string): number | null {
    return this.state.getEntityByName(name);
  }

  shouldIgnoreUnknownAttribute(attrName: string): boolean {
    return this.ignoreSet.has(attrName);
  }
}
