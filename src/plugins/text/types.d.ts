declare module 'troika-three-text' {
  import type { Mesh, Material, Color } from 'three';

  export interface TextRenderInfo {
    blockBounds: [number, number, number, number];
    visibleBounds: [number, number, number, number];
    caretPositions: Float32Array;
    caretHeight: number;
    ascender: number;
    descender: number;
    lineHeight: number;
    topBaseline: number;
  }

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
    textRenderInfo: TextRenderInfo | null;

    sync(callback?: () => void): void;
    dispose(): void;
  }
}
