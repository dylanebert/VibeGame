export class EntityRegistry {
  private readonly nameToEntity = new Map<string, number>();
  private readonly entityToName = new Map<number, string>();

  setName(name: string, entity: number): void {
    const oldName = this.entityToName.get(entity);
    if (oldName !== undefined) {
      this.nameToEntity.delete(oldName);
    }

    const oldEntity = this.nameToEntity.get(name);
    if (oldEntity !== undefined && oldEntity !== entity) {
      this.entityToName.delete(oldEntity);
    }

    this.nameToEntity.set(name, entity);
    this.entityToName.set(entity, name);
  }

  getByName(name: string): number | null {
    return this.nameToEntity.get(name) ?? null;
  }

  getName(entity: number): string | undefined {
    return this.entityToName.get(entity);
  }

  getAll(): Map<string, number> {
    return new Map(this.nameToEntity);
  }
}
