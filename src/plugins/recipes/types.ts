export interface EntityCreationResult {
  entity: number;
  tagName: string;
  children: EntityCreationResult[];
}
