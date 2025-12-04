import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { State } from '../../core';

export interface LineBatch {
  segments: LineSegments2;
  geometry: LineSegmentsGeometry;
  material: LineMaterial;
}

export interface LineContext {
  batches: Map<string, LineBatch>;
  resolution: THREE.Vector2;
}

const stateToLineContext = new WeakMap<State, LineContext>();

export function getLineContext(state: State): LineContext {
  let context = stateToLineContext.get(state);
  if (!context) {
    context = {
      batches: new Map(),
      resolution: new THREE.Vector2(1024, 768),
    };
    stateToLineContext.set(state, context);
  }
  return context;
}

export function getMaterialKey(thickness: number, opacity: number): string {
  return `${thickness}-${opacity}`;
}

export function getOrCreateBatch(
  context: LineContext,
  key: string,
  thickness: number,
  opacity: number,
  scene: THREE.Scene
): LineBatch {
  let batch = context.batches.get(key);
  if (!batch) {
    const geometry = new LineSegmentsGeometry();
    const material = new LineMaterial({
      vertexColors: true,
      worldUnits: false,
      linewidth: thickness,
      opacity: opacity,
      transparent: opacity < 1,
      resolution: context.resolution,
    });
    const segments = new LineSegments2(geometry, material);
    segments.frustumCulled = false;
    scene.add(segments);
    batch = { segments, geometry, material };
    context.batches.set(key, batch);
  }
  return batch;
}

export function disposeBatch(batch: LineBatch, scene: THREE.Scene): void {
  scene.remove(batch.segments);
  batch.geometry.dispose();
  batch.material.dispose();
}
