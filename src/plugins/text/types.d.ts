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
    // Core text
    text: string;
    fontSize: number;
    color: number | string | Color;
    letterSpacing: number;
    lineHeight: number;
    font: string | null;

    // Positioning
    anchorX: 'left' | 'center' | 'right' | number;
    anchorY:
      | 'top'
      | 'top-baseline'
      | 'top-cap'
      | 'top-ex'
      | 'middle'
      | 'bottom-baseline'
      | 'bottom'
      | number;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    maxWidth: number | undefined;

    // Outline/glow
    outlineWidth: number | string;
    outlineColor: number | string | Color;
    outlineBlur: number | string;
    outlineOffsetX: number | string;
    outlineOffsetY: number | string;
    outlineOpacity: number;

    // Stroke
    strokeWidth: number | string;
    strokeColor: number | string | Color;
    strokeOpacity: number;

    // Fill
    fillOpacity: number;

    // Curve
    curveRadius: number;

    // Clip
    clipRect: [number, number, number, number] | null;

    // Rendering
    material: Material;
    depthOffset: number;
    textRenderInfo: TextRenderInfo | null;

    sync(callback?: () => void): void;
    dispose(): void;
  }
}
