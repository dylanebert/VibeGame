declare module 'troika-three-text' {
  import type { Mesh, Material, Color } from 'three';

  export class Text extends Mesh {
    text: string;
    fontSize: number;
    color: number | string | Color;
    anchorX: 'left' | 'center' | 'right' | number;
    anchorY:
      | 'top'
      | 'top-baseline'
      | 'middle'
      | 'bottom-baseline'
      | 'bottom'
      | number;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    maxWidth: number | undefined;
    lineHeight: number;
    font: string | null;
    material: Material;

    sync(callback?: () => void): void;
    dispose(): void;
  }
}
