import * as THREE from 'three';
import type { State } from '../../core';
import { defineQuery, type System } from '../../core';
import { WorldTransform } from '../transforms';
import { getScene, getRenderingContext } from '../rendering';
import { Line as LineComponent } from './components';
import {
  getLineContext,
  getMaterialKey,
  getOrCreateBatch,
  disposeBatch,
} from './utils';

const lineQuery = defineQuery([LineComponent, WorldTransform]);

const ARROW_ANGLE = Math.PI / 6;

interface LineData {
  entity: number;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  color: THREE.Color;
  arrowStart: boolean;
  arrowEnd: boolean;
  arrowSize: number;
  visible: boolean;
}

function computeArrowWing(
  start: THREE.Vector3,
  end: THREE.Vector3,
  arrowSize: number,
  atStart: boolean,
  wingIndex: number
): { tip: THREE.Vector3; wingEnd: THREE.Vector3 } {
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  const arrowTip = atStart ? start.clone() : end.clone();
  const arrowDir = atStart ? direction : direction.clone().negate();

  const perpendicular = new THREE.Vector3();
  if (Math.abs(direction.y) < 0.9) {
    perpendicular
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize();
  } else {
    perpendicular
      .crossVectors(direction, new THREE.Vector3(1, 0, 0))
      .normalize();
  }

  const angle = wingIndex === 0 ? ARROW_ANGLE : -ARROW_ANGLE;
  const wingDir = arrowDir
    .clone()
    .applyAxisAngle(perpendicular, angle)
    .multiplyScalar(arrowSize);
  const wingEnd = arrowTip.clone().add(wingDir);

  return { tip: arrowTip, wingEnd };
}

function pushSegment(
  positions: number[],
  colors: number[],
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: THREE.Color
): void {
  positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
  colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
}

function buildBatchArrays(lines: LineData[]): {
  positions: number[];
  colors: number[];
} {
  const positions: number[] = [];
  const colors: number[] = [];

  for (const line of lines) {
    if (!line.visible) continue;

    // Main line segment
    pushSegment(positions, colors, line.startPos, line.endPos, line.color);

    // Arrow at start
    if (line.arrowStart && line.arrowSize > 0) {
      for (let i = 0; i < 2; i++) {
        const { tip, wingEnd } = computeArrowWing(
          line.startPos,
          line.endPos,
          line.arrowSize,
          true,
          i
        );
        pushSegment(positions, colors, tip, wingEnd, line.color);
      }
    }

    // Arrow at end
    if (line.arrowEnd && line.arrowSize > 0) {
      for (let i = 0; i < 2; i++) {
        const { tip, wingEnd } = computeArrowWing(
          line.startPos,
          line.endPos,
          line.arrowSize,
          false,
          i
        );
        pushSegment(positions, colors, tip, wingEnd, line.color);
      }
    }
  }

  return { positions, colors };
}

export const LineSystem: System = {
  group: 'draw',
  update(state: State) {
    const scene = getScene(state);
    if (!scene) return;

    const renderContext = getRenderingContext(state);
    const context = getLineContext(state);
    const entities = lineQuery(state.world);

    // Update resolution
    if (renderContext?.renderer) {
      context.resolution.set(
        renderContext.renderer.domElement.width,
        renderContext.renderer.domElement.height
      );
      for (const batch of context.batches.values()) {
        batch.material.resolution.copy(context.resolution);
      }
    }

    // Group lines by material key
    const linesByMaterial = new Map<string, LineData[]>();

    for (const entity of entities) {
      const thickness = LineComponent.thickness[entity];
      const opacity = LineComponent.opacity[entity];
      const key = getMaterialKey(thickness, opacity);

      const startPos = new THREE.Vector3(
        WorldTransform.posX[entity],
        WorldTransform.posY[entity],
        WorldTransform.posZ[entity]
      );

      const endPos = new THREE.Vector3(
        startPos.x + LineComponent.offsetX[entity],
        startPos.y + LineComponent.offsetY[entity],
        startPos.z + LineComponent.offsetZ[entity]
      );

      const lineData: LineData = {
        entity,
        startPos,
        endPos,
        color: new THREE.Color(LineComponent.color[entity]),
        arrowStart: LineComponent.arrowStart[entity] === 1,
        arrowEnd: LineComponent.arrowEnd[entity] === 1,
        arrowSize: LineComponent.arrowSize[entity],
        visible: LineComponent.visible[entity] === 1,
      };

      let group = linesByMaterial.get(key);
      if (!group) {
        group = [];
        linesByMaterial.set(key, group);
      }
      group.push(lineData);
    }

    // Track which batches are used this frame
    const usedBatches = new Set<string>();

    // Update each batch
    for (const [key, lines] of linesByMaterial) {
      usedBatches.add(key);

      const thickness = LineComponent.thickness[lines[0].entity];
      const opacity = LineComponent.opacity[lines[0].entity];
      const batch = getOrCreateBatch(context, key, thickness, opacity, scene);

      const { positions, colors } = buildBatchArrays(lines);

      if (positions.length > 0) {
        // Clear Three.js internal cache to allow instance count to grow
        // Three.js only sets _maxInstanceCount when undefined, causing render limits
        delete (batch.geometry as { _maxInstanceCount?: number })
          ._maxInstanceCount;
        batch.geometry.setPositions(positions);
        batch.geometry.setColors(colors);
        batch.segments.computeLineDistances();
        batch.segments.visible = true;
      } else {
        batch.segments.visible = false;
      }
    }

    // Remove unused batches
    for (const [key, batch] of context.batches) {
      if (!usedBatches.has(key)) {
        disposeBatch(batch, scene);
        context.batches.delete(key);
      }
    }
  },
};
