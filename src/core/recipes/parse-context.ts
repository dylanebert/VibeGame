import type { State } from '../ecs/state';

export class ParseContext {
  constructor(private state: State) {}

  setName(name: string, entity: number): void {
    this.state.setEntityName(name, entity);
  }

  getEntityByName(name: string): number | null {
    return this.state.getEntityByName(name);
  }
}
