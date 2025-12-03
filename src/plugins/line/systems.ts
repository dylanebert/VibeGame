import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { State } from '../../core';
import { defineQuery, type System } from '../../core';
import { WorldTransform } from '../transforms';
import { getScene, getRenderingContext } from '../rendering';
import { Line as LineComponent } from './components';
import { getLineContext } from './utils';

const lineQuery = defineQuery([LineComponent, WorldTransform]);

const ARROW_ANGLE = Math.PI / 6;

function createLine(material: LineMaterial): Line2 {
  const geometry = new LineGeometry();
  geometry.setPositions([0, 0, 0, 0, 0, 0]);
  return new Line2(geometry, material);
}

function updateLineGeometry(
  line: Line2,
  start: THREE.Vector3,
  end: THREE.Vector3
): void {
  const geometry = line.geometry as LineGeometry;
  geometry.setPositions([start.x, start.y, start.z, end.x, end.y, end.z]);
  line.computeLineDistances();
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

function createArrowLines(
  start: THREE.Vector3,
  end: THREE.Vector3,
  arrowSize: number,
  material: LineMaterial,
  atStart: boolean
): Line2[] {
  const arrows: Line2[] = [];

  for (let i = 0; i < 2; i++) {
    const { tip, wingEnd } = computeArrowWing(
      start,
      end,
      arrowSize,
      atStart,
      i
    );
    const arrowLine = createLine(material);
    updateLineGeometry(arrowLine, tip, wingEnd);
    arrows.push(arrowLine);
  }

  return arrows;
}

function updateArrowLines(
  arrows: Line2[],
  start: THREE.Vector3,
  end: THREE.Vector3,
  arrowSize: number,
  atStart: boolean
): void {
  for (let i = 0; i < arrows.length; i++) {
    const { tip, wingEnd } = computeArrowWing(
      start,
      end,
      arrowSize,
      atStart,
      i
    );
    updateLineGeometry(arrows[i], tip, wingEnd);
  }
}

export const LineSystem: System = {
  group: 'draw',
  update(state: State) {
    const scene = getScene(state);
    if (!scene) return;

    const renderContext = getRenderingContext(state);
    const context = getLineContext(state);
    const entities = lineQuery(state.world);

    if (!context.material) {
      context.material = new LineMaterial({
        vertexColors: true,
        worldUnits: false,
        linewidth: 2,
        resolution: new THREE.Vector2(
          renderContext?.renderer?.domElement.width || 1024,
          renderContext?.renderer?.domElement.height || 768
        ),
      });
    }

    if (renderContext?.renderer) {
      context.material.resolution.set(
        renderContext.renderer.domElement.width,
        renderContext.renderer.domElement.height
      );
    }

    for (const entity of entities) {
      let entry = context.lines.get(entity);

      if (!entry) {
        const line = createLine(context.material);
        scene.add(line);
        entry = { line, arrowStartLines: [], arrowEndLines: [] };
        context.lines.set(entity, entry);
        LineComponent.dirty[entity] = 1;
      }

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

      updateLineGeometry(entry.line, startPos, endPos);

      const visible = LineComponent.visible[entity] === 1;
      entry.line.visible = visible;

      const arrowSize = LineComponent.arrowSize[entity];

      if (LineComponent.dirty[entity] === 1) {
        const color = new THREE.Color(LineComponent.color[entity]);
        const geometry = entry.line.geometry as LineGeometry;
        geometry.setColors([
          color.r,
          color.g,
          color.b,
          color.r,
          color.g,
          color.b,
        ]);

        entry.line.material = context.material.clone();
        (entry.line.material as LineMaterial).linewidth =
          LineComponent.thickness[entity];
        (entry.line.material as LineMaterial).opacity =
          LineComponent.opacity[entity];
        (entry.line.material as LineMaterial).transparent =
          LineComponent.opacity[entity] < 1;

        for (const arrowLine of entry.arrowStartLines) {
          scene.remove(arrowLine);
          arrowLine.geometry.dispose();
        }
        entry.arrowStartLines = [];

        for (const arrowLine of entry.arrowEndLines) {
          scene.remove(arrowLine);
          arrowLine.geometry.dispose();
        }
        entry.arrowEndLines = [];

        if (LineComponent.arrowStart[entity] === 1 && arrowSize > 0) {
          const arrows = createArrowLines(
            startPos,
            endPos,
            arrowSize,
            entry.line.material as LineMaterial,
            true
          );
          for (const arrow of arrows) {
            const arrowGeometry = arrow.geometry as LineGeometry;
            arrowGeometry.setColors([
              color.r,
              color.g,
              color.b,
              color.r,
              color.g,
              color.b,
            ]);
            scene.add(arrow);
            entry.arrowStartLines.push(arrow);
          }
        }

        if (LineComponent.arrowEnd[entity] === 1 && arrowSize > 0) {
          const arrows = createArrowLines(
            startPos,
            endPos,
            arrowSize,
            entry.line.material as LineMaterial,
            false
          );
          for (const arrow of arrows) {
            const arrowGeometry = arrow.geometry as LineGeometry;
            arrowGeometry.setColors([
              color.r,
              color.g,
              color.b,
              color.r,
              color.g,
              color.b,
            ]);
            scene.add(arrow);
            entry.arrowEndLines.push(arrow);
          }
        }

        LineComponent.dirty[entity] = 0;
      } else {
        if (entry.arrowStartLines.length > 0) {
          updateArrowLines(
            entry.arrowStartLines,
            startPos,
            endPos,
            arrowSize,
            true
          );
        }
        if (entry.arrowEndLines.length > 0) {
          updateArrowLines(
            entry.arrowEndLines,
            startPos,
            endPos,
            arrowSize,
            false
          );
        }
      }

      for (const arrowLine of entry.arrowStartLines) {
        arrowLine.visible = visible;
      }
      for (const arrowLine of entry.arrowEndLines) {
        arrowLine.visible = visible;
      }
    }

    for (const [entity, entry] of context.lines) {
      if (!state.exists(entity) || !state.hasComponent(entity, LineComponent)) {
        scene.remove(entry.line);
        entry.line.geometry.dispose();
        if (entry.line.material !== context.material) {
          (entry.line.material as LineMaterial).dispose();
        }
        for (const arrowLine of entry.arrowStartLines) {
          scene.remove(arrowLine);
          arrowLine.geometry.dispose();
        }
        for (const arrowLine of entry.arrowEndLines) {
          scene.remove(arrowLine);
          arrowLine.geometry.dispose();
        }
        context.lines.delete(entity);
      }
    }
  },
};
