import { beforeEach, describe, expect, it } from 'bun:test';
import { State } from 'vibegame';
import { Line, LinePlugin } from 'vibegame/line';
import { RenderingPlugin, getRenderingContext } from 'vibegame/rendering';
import {
  Transform,
  TransformsPlugin,
  WorldTransform,
} from 'vibegame/transforms';
import { LineSystem } from '../../../src/plugins/line/systems';
import {
  getLineContext,
  getMaterialKey,
} from '../../../src/plugins/line/utils';

function createLineEntity(state: State): number {
  const entity = state.createEntity();
  state.addComponent(entity, Transform);
  state.addComponent(entity, WorldTransform);
  state.addComponent(entity, Line);
  return entity;
}

function runLineSystem(state: State): void {
  LineSystem.update?.(state);
}

describe('Line Batching', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(RenderingPlugin);
    state.registerPlugin(LinePlugin);
    getRenderingContext(state);
  });

  describe('Batch Creation & Grouping', () => {
    it('should create single batch for lines with same thickness and opacity', () => {
      const line1 = createLineEntity(state);
      const line2 = createLineEntity(state);
      const line3 = createLineEntity(state);

      Line.thickness[line1] = 2;
      Line.thickness[line2] = 2;
      Line.thickness[line3] = 2;
      Line.opacity[line1] = 1;
      Line.opacity[line2] = 1;
      Line.opacity[line3] = 1;

      Line.offsetX[line1] = 1;
      Line.offsetX[line2] = 2;
      Line.offsetX[line3] = 3;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(1);
    });

    it('should create separate batches for lines with different thickness', () => {
      const line1 = createLineEntity(state);
      const line2 = createLineEntity(state);
      const line3 = createLineEntity(state);

      Line.thickness[line1] = 1;
      Line.thickness[line2] = 2;
      Line.thickness[line3] = 3;
      Line.opacity[line1] = 1;
      Line.opacity[line2] = 1;
      Line.opacity[line3] = 1;

      Line.offsetX[line1] = 1;
      Line.offsetX[line2] = 2;
      Line.offsetX[line3] = 3;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(3);
    });

    it('should create separate batches for lines with different opacity', () => {
      const line1 = createLineEntity(state);
      const line2 = createLineEntity(state);

      Line.thickness[line1] = 2;
      Line.thickness[line2] = 2;
      Line.opacity[line1] = 1.0;
      Line.opacity[line2] = 0.5;

      Line.offsetX[line1] = 1;
      Line.offsetX[line2] = 2;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(2);
    });

    it('should batch count match unique (thickness, opacity) pairs', () => {
      const entities = [];
      for (let i = 0; i < 10; i++) {
        entities.push(createLineEntity(state));
      }

      // 3 unique pairs: (1, 1), (2, 1), (2, 0.5)
      Line.thickness[entities[0]] = 1;
      Line.opacity[entities[0]] = 1;
      Line.thickness[entities[1]] = 1;
      Line.opacity[entities[1]] = 1;
      Line.thickness[entities[2]] = 1;
      Line.opacity[entities[2]] = 1;
      Line.thickness[entities[3]] = 2;
      Line.opacity[entities[3]] = 1;
      Line.thickness[entities[4]] = 2;
      Line.opacity[entities[4]] = 1;
      Line.thickness[entities[5]] = 2;
      Line.opacity[entities[5]] = 0.5;
      Line.thickness[entities[6]] = 2;
      Line.opacity[entities[6]] = 0.5;
      Line.thickness[entities[7]] = 1;
      Line.opacity[entities[7]] = 1;
      Line.thickness[entities[8]] = 2;
      Line.opacity[entities[8]] = 0.5;
      Line.thickness[entities[9]] = 2;
      Line.opacity[entities[9]] = 1;

      for (let i = 0; i < entities.length; i++) {
        Line.offsetX[entities[i]] = i + 1;
      }

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(3);
    });

    it('should use correct material key format', () => {
      expect(getMaterialKey(2, 1)).toBe('2-1');
      expect(getMaterialKey(3.5, 0.5)).toBe('3.5-0.5');
    });
  });

  describe('Visibility Dynamics', () => {
    it('should update geometry when toggling single line visibility', () => {
      const line1 = createLineEntity(state);
      const line2 = createLineEntity(state);

      Line.thickness[line1] = 2;
      Line.thickness[line2] = 2;
      Line.opacity[line1] = 1;
      Line.opacity[line2] = 1;
      Line.visible[line1] = 1;
      Line.visible[line2] = 1;
      Line.offsetX[line1] = 1;
      Line.offsetX[line2] = 2;

      runLineSystem(state);

      const context = getLineContext(state);
      const batch = context.batches.get(getMaterialKey(2, 1))!;
      expect(batch.segments.visible).toBe(true);

      // Hide one line
      Line.visible[line1] = 0;
      runLineSystem(state);

      expect(batch.segments.visible).toBe(true);
    });

    it('should set batch invisible when all lines in batch are hidden', () => {
      const line1 = createLineEntity(state);
      const line2 = createLineEntity(state);

      Line.thickness[line1] = 2;
      Line.thickness[line2] = 2;
      Line.opacity[line1] = 1;
      Line.opacity[line2] = 1;
      Line.visible[line1] = 1;
      Line.visible[line2] = 1;
      Line.offsetX[line1] = 1;
      Line.offsetX[line2] = 2;

      runLineSystem(state);

      const context = getLineContext(state);
      const key = getMaterialKey(2, 1);
      const batch = context.batches.get(key)!;
      expect(batch.segments.visible).toBe(true);

      // Hide both lines
      Line.visible[line1] = 0;
      Line.visible[line2] = 0;
      runLineSystem(state);

      expect(batch.segments.visible).toBe(false);
    });

    it('should show batch again when one line becomes visible', () => {
      const line1 = createLineEntity(state);
      const line2 = createLineEntity(state);

      Line.thickness[line1] = 2;
      Line.thickness[line2] = 2;
      Line.opacity[line1] = 1;
      Line.opacity[line2] = 1;
      Line.visible[line1] = 0;
      Line.visible[line2] = 0;
      Line.offsetX[line1] = 1;
      Line.offsetX[line2] = 2;

      runLineSystem(state);

      const context = getLineContext(state);
      const key = getMaterialKey(2, 1);
      const batch = context.batches.get(key)!;
      expect(batch.segments.visible).toBe(false);

      // Show one line
      Line.visible[line1] = 1;
      runLineSystem(state);

      expect(batch.segments.visible).toBe(true);
    });

    it('should handle mix of visible and hidden lines in same batch', () => {
      const entities = [];
      for (let i = 0; i < 5; i++) {
        const e = createLineEntity(state);
        Line.thickness[e] = 2;
        Line.opacity[e] = 1;
        Line.offsetX[e] = i + 1;
        entities.push(e);
      }

      // Set alternating visibility
      Line.visible[entities[0]] = 1;
      Line.visible[entities[1]] = 0;
      Line.visible[entities[2]] = 1;
      Line.visible[entities[3]] = 0;
      Line.visible[entities[4]] = 1;

      runLineSystem(state);

      const context = getLineContext(state);
      const key = getMaterialKey(2, 1);
      const batch = context.batches.get(key)!;
      expect(batch.segments.visible).toBe(true);
    });
  });

  describe('Entity Lifecycle', () => {
    it('should create batch when adding line entity', () => {
      const context = getLineContext(state);
      expect(context.batches.size).toBe(0);

      const line = createLineEntity(state);
      Line.thickness[line] = 2;
      Line.opacity[line] = 1;
      Line.offsetX[line] = 5;

      runLineSystem(state);

      expect(context.batches.size).toBe(1);
    });

    it('should dispose batch when all lines removed', () => {
      const line1 = createLineEntity(state);
      const line2 = createLineEntity(state);

      Line.thickness[line1] = 2;
      Line.thickness[line2] = 2;
      Line.opacity[line1] = 1;
      Line.opacity[line2] = 1;
      Line.offsetX[line1] = 1;
      Line.offsetX[line2] = 2;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(1);

      // Remove line component from both
      state.removeComponent(line1, Line);
      state.removeComponent(line2, Line);
      runLineSystem(state);

      expect(context.batches.size).toBe(0);
    });

    it('should create new batch after previous batch was disposed', () => {
      const line1 = createLineEntity(state);
      Line.thickness[line1] = 2;
      Line.opacity[line1] = 1;
      Line.offsetX[line1] = 1;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(1);

      state.removeComponent(line1, Line);
      runLineSystem(state);
      expect(context.batches.size).toBe(0);

      // Add new line with same properties
      const line2 = createLineEntity(state);
      Line.thickness[line2] = 2;
      Line.opacity[line2] = 1;
      Line.offsetX[line2] = 2;

      runLineSystem(state);
      expect(context.batches.size).toBe(1);
    });

    it('should handle removing one line while keeping batch for others', () => {
      const line1 = createLineEntity(state);
      const line2 = createLineEntity(state);
      const line3 = createLineEntity(state);

      Line.thickness[line1] = 2;
      Line.thickness[line2] = 2;
      Line.thickness[line3] = 2;
      Line.opacity[line1] = 1;
      Line.opacity[line2] = 1;
      Line.opacity[line3] = 1;
      Line.offsetX[line1] = 1;
      Line.offsetX[line2] = 2;
      Line.offsetX[line3] = 3;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(1);

      state.removeComponent(line2, Line);
      runLineSystem(state);

      expect(context.batches.size).toBe(1);
      expect(context.batches.get(getMaterialKey(2, 1))!.segments.visible).toBe(
        true
      );
    });
  });

  describe('Position Updates', () => {
    it('should update line position when WorldTransform changes', () => {
      const line = createLineEntity(state);
      Line.thickness[line] = 2;
      Line.opacity[line] = 1;
      Line.offsetX[line] = 5;

      WorldTransform.posX[line] = 0;
      WorldTransform.posY[line] = 0;
      WorldTransform.posZ[line] = 0;

      runLineSystem(state);

      // Change position
      WorldTransform.posX[line] = 10;
      WorldTransform.posY[line] = 5;
      WorldTransform.posZ[line] = -3;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(1);
    });

    it('should update line endpoint when offset changes', () => {
      const line = createLineEntity(state);
      Line.thickness[line] = 2;
      Line.opacity[line] = 1;
      Line.offsetX[line] = 5;
      Line.offsetY[line] = 0;
      Line.offsetZ[line] = 0;

      runLineSystem(state);

      // Change offset
      Line.offsetX[line] = 10;
      Line.offsetY[line] = 5;
      Line.offsetZ[line] = -2;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(1);
    });

    it('should handle bulk position updates (animation simulation)', () => {
      const entities = [];
      for (let i = 0; i < 10; i++) {
        const e = createLineEntity(state);
        Line.thickness[e] = 2;
        Line.opacity[e] = 1;
        Line.offsetX[e] = 1;
        entities.push(e);
      }

      // Simulate multiple animation frames
      for (let frame = 0; frame < 5; frame++) {
        for (let i = 0; i < entities.length; i++) {
          const entity = entities[i];
          WorldTransform.posX[entity] = Math.cos(frame + i) * 4;
          WorldTransform.posY[entity] = Math.sin(frame + i) * 4;
          Line.offsetX[entity] = 2 + Math.sin(frame * 2 + i);
          Line.offsetY[entity] = Math.cos(frame * 3 + i);
        }
        runLineSystem(state);
      }

      const context = getLineContext(state);
      expect(context.batches.size).toBe(1);
    });
  });

  describe('Property Changes (Batch Migration)', () => {
    it('should move line to new batch when thickness changes', () => {
      const line = createLineEntity(state);
      Line.thickness[line] = 2;
      Line.opacity[line] = 1;
      Line.offsetX[line] = 5;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.has(getMaterialKey(2, 1))).toBe(true);

      // Change thickness
      Line.thickness[line] = 5;
      runLineSystem(state);

      expect(context.batches.has(getMaterialKey(5, 1))).toBe(true);
      expect(context.batches.has(getMaterialKey(2, 1))).toBe(false);
    });

    it('should move line to new batch when opacity changes', () => {
      const line = createLineEntity(state);
      Line.thickness[line] = 2;
      Line.opacity[line] = 1;
      Line.offsetX[line] = 5;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.has(getMaterialKey(2, 1))).toBe(true);

      // Change opacity
      Line.opacity[line] = 0.5;
      runLineSystem(state);

      expect(context.batches.has(getMaterialKey(2, 0.5))).toBe(true);
      expect(context.batches.has(getMaterialKey(2, 1))).toBe(false);
    });

    it('should keep line in same batch when color changes', () => {
      const line = createLineEntity(state);
      Line.thickness[line] = 2;
      Line.opacity[line] = 1;
      Line.color[line] = 0xff0000;
      Line.offsetX[line] = 5;

      runLineSystem(state);

      const context = getLineContext(state);
      const key = getMaterialKey(2, 1);
      expect(context.batches.has(key)).toBe(true);
      expect(context.batches.size).toBe(1);

      // Change color
      Line.color[line] = 0x00ff00;
      runLineSystem(state);

      expect(context.batches.size).toBe(1);
      expect(context.batches.has(key)).toBe(true);
    });

    it('should handle multiple lines migrating to same new batch', () => {
      const line1 = createLineEntity(state);
      const line2 = createLineEntity(state);

      Line.thickness[line1] = 2;
      Line.thickness[line2] = 3;
      Line.opacity[line1] = 1;
      Line.opacity[line2] = 1;
      Line.offsetX[line1] = 1;
      Line.offsetX[line2] = 2;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(2);

      // Both change to same thickness
      Line.thickness[line1] = 5;
      Line.thickness[line2] = 5;
      runLineSystem(state);

      expect(context.batches.size).toBe(1);
      expect(context.batches.has(getMaterialKey(5, 1))).toBe(true);
    });
  });

  describe('Arrow Segments', () => {
    it('should include arrow segments when arrowEnd enabled', () => {
      const line = createLineEntity(state);
      Line.thickness[line] = 2;
      Line.opacity[line] = 1;
      Line.offsetX[line] = 5;
      Line.arrowEnd[line] = 1;
      Line.arrowSize[line] = 0.3;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(1);
    });

    it('should include arrow segments when arrowStart enabled', () => {
      const line = createLineEntity(state);
      Line.thickness[line] = 2;
      Line.opacity[line] = 1;
      Line.offsetX[line] = 5;
      Line.arrowStart[line] = 1;
      Line.arrowSize[line] = 0.3;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(1);
    });

    it('should include both arrow segments when both enabled', () => {
      const line = createLineEntity(state);
      Line.thickness[line] = 2;
      Line.opacity[line] = 1;
      Line.offsetX[line] = 5;
      Line.arrowStart[line] = 1;
      Line.arrowEnd[line] = 1;
      Line.arrowSize[line] = 0.3;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(1);
    });

    it('should update arrows when toggling mid-stream', () => {
      const line = createLineEntity(state);
      Line.thickness[line] = 2;
      Line.opacity[line] = 1;
      Line.offsetX[line] = 5;
      Line.arrowEnd[line] = 0;

      runLineSystem(state);

      // Enable arrow
      Line.arrowEnd[line] = 1;
      Line.arrowSize[line] = 0.3;
      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(1);

      // Disable arrow
      Line.arrowEnd[line] = 0;
      runLineSystem(state);

      expect(context.batches.size).toBe(1);
    });

    it('should not include arrow segments when arrowSize is 0', () => {
      const line = createLineEntity(state);
      Line.thickness[line] = 2;
      Line.opacity[line] = 1;
      Line.offsetX[line] = 5;
      Line.arrowEnd[line] = 1;
      Line.arrowSize[line] = 0;

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(1);
    });
  });

  describe('Multi-Batch Stress', () => {
    it('should handle many lines across multiple batches', () => {
      const entities = [];

      // Create 20 lines across 5 different batches
      for (let i = 0; i < 20; i++) {
        const e = createLineEntity(state);
        Line.thickness[e] = (i % 5) + 1;
        Line.opacity[e] = 1;
        Line.offsetX[e] = i + 1;
        entities.push(e);
      }

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(5);
    });

    it('should handle rapid visibility toggles across batches', () => {
      const entities = [];

      for (let i = 0; i < 15; i++) {
        const e = createLineEntity(state);
        Line.thickness[e] = (i % 3) + 1;
        Line.opacity[e] = 1;
        Line.offsetX[e] = i + 1;
        Line.visible[e] = 1;
        entities.push(e);
      }

      runLineSystem(state);

      // Rapidly toggle visibility
      for (let frame = 0; frame < 10; frame++) {
        for (let i = 0; i < entities.length; i++) {
          Line.visible[entities[i]] = (frame + i) % 2;
        }
        runLineSystem(state);
      }

      const context = getLineContext(state);
      expect(context.batches.size).toBe(3);
    });

    it('should handle removing lines from multiple batches in one frame', () => {
      const entities = [];

      for (let i = 0; i < 12; i++) {
        const e = createLineEntity(state);
        Line.thickness[e] = (i % 3) + 1;
        Line.opacity[e] = 1;
        Line.offsetX[e] = i + 1;
        entities.push(e);
      }

      runLineSystem(state);

      const context = getLineContext(state);
      expect(context.batches.size).toBe(3);

      // Remove some entities from each batch (indices 0, 3, 6, 9 from thickness 1)
      state.removeComponent(entities[0], Line);
      state.removeComponent(entities[3], Line);
      state.removeComponent(entities[6], Line);
      state.removeComponent(entities[9], Line);

      runLineSystem(state);

      expect(context.batches.size).toBe(2);
    });

    it('should handle interleaved add/remove operations', () => {
      const context = getLineContext(state);

      const line1 = createLineEntity(state);
      Line.thickness[line1] = 1;
      Line.opacity[line1] = 1;
      Line.offsetX[line1] = 1;
      runLineSystem(state);
      expect(context.batches.size).toBe(1);

      const line2 = createLineEntity(state);
      Line.thickness[line2] = 2;
      Line.opacity[line2] = 1;
      Line.offsetX[line2] = 2;
      runLineSystem(state);
      expect(context.batches.size).toBe(2);

      state.removeComponent(line1, Line);
      runLineSystem(state);
      expect(context.batches.size).toBe(1);

      const line3 = createLineEntity(state);
      Line.thickness[line3] = 1;
      Line.opacity[line3] = 1;
      Line.offsetX[line3] = 3;
      runLineSystem(state);
      expect(context.batches.size).toBe(2);

      state.removeComponent(line2, Line);
      state.removeComponent(line3, Line);
      runLineSystem(state);
      expect(context.batches.size).toBe(0);
    });
  });

  describe('Token Box Pattern (Real-world usage)', () => {
    it('should handle lines updated via Transform (not WorldTransform directly)', () => {
      const entities = [];
      for (let i = 0; i < 4; i++) {
        const e = createLineEntity(state);
        Line.thickness[e] = 1.5;
        Line.opacity[e] = 1;
        Line.visible[e] = 1;
        entities.push(e);
      }

      // Frame 1: Set positions via Transform
      Transform.posX[entities[0]] = 0;
      Transform.posY[entities[0]] = 1;
      Line.offsetX[entities[0]] = 2;

      Transform.posX[entities[1]] = 2;
      Transform.posY[entities[1]] = 1;
      Line.offsetY[entities[1]] = -2;

      Transform.posX[entities[2]] = 0;
      Transform.posY[entities[2]] = -1;
      Line.offsetX[entities[2]] = 2;

      Transform.posX[entities[3]] = 0;
      Transform.posY[entities[3]] = -1;
      Line.offsetY[entities[3]] = 2;

      // Sync WorldTransform (simulating TransformHierarchySystem)
      for (const e of entities) {
        WorldTransform.posX[e] = Transform.posX[e];
        WorldTransform.posY[e] = Transform.posY[e];
        WorldTransform.posZ[e] = Transform.posZ[e];
      }

      runLineSystem(state);

      const context = getLineContext(state);
      const key = getMaterialKey(1.5, 1);
      const batch = context.batches.get(key)!;
      expect(batch.segments.visible).toBe(true);
      expect(batch.geometry.getAttribute('instanceStart').count).toBe(4);
    });

    it('should handle zero-offset lines (offsetT = 0)', () => {
      // When offsetT = 0, lines have zero offset - they should still exist
      const line = createLineEntity(state);
      Line.thickness[line] = 1.5;
      Line.opacity[line] = 1;
      Line.visible[line] = 1;
      Line.offsetX[line] = 0;
      Line.offsetY[line] = 0;
      Line.offsetZ[line] = 0;

      WorldTransform.posX[line] = 5;
      WorldTransform.posY[line] = 5;

      runLineSystem(state);

      const context = getLineContext(state);
      const key = getMaterialKey(1.5, 1);
      const batch = context.batches.get(key)!;
      expect(batch.segments.visible).toBe(true);
      // Zero-length line still contributes 1 segment
      expect(batch.geometry.getAttribute('instanceStart').count).toBe(1);
    });

    it('should handle progressive offsetT animation pattern', () => {
      const entities = [];
      for (let i = 0; i < 4; i++) {
        const e = createLineEntity(state);
        Line.thickness[e] = 1.5;
        Line.opacity[e] = 1;
        Line.visible[e] = 1;
        entities.push(e);
      }

      const boxWidth = 2;
      const boxHeight = 1;

      // Animate offsetT from 0 to 1 over several frames
      for (let offsetT = 0; offsetT <= 1; offsetT += 0.1) {
        Line.offsetX[entities[0]] = boxWidth * offsetT;
        Line.offsetY[entities[1]] = -boxHeight * offsetT;
        Line.offsetX[entities[2]] = boxWidth * offsetT;
        Line.offsetY[entities[3]] = boxHeight * offsetT;

        runLineSystem(state);

        const context = getLineContext(state);
        const key = getMaterialKey(1.5, 1);
        const batch = context.batches.get(key)!;
        expect(batch.segments.visible).toBe(true);
        expect(batch.geometry.getAttribute('instanceStart').count).toBe(4);
      }
    });
  });

  describe('Instance Count Bug (Three.js _maxInstanceCount)', () => {
    it('should render all lines when visible count grows', () => {
      const entities = [];
      for (let i = 0; i < 10; i++) {
        const e = createLineEntity(state);
        Line.thickness[e] = 2;
        Line.opacity[e] = 1;
        Line.offsetX[e] = i + 1;
        Line.visible[e] = 0; // Start hidden
        entities.push(e);
      }

      // Frame 1: Only 1 line visible
      Line.visible[entities[0]] = 1;
      runLineSystem(state);

      const context = getLineContext(state);
      const key = getMaterialKey(2, 1);
      const batch = context.batches.get(key)!;

      // Access internal geometry data to verify segment count
      const posAttr1 = batch.geometry.getAttribute('instanceStart');
      const initialCount = posAttr1.count;
      expect(initialCount).toBeGreaterThan(0);

      // Frame 2: 5 lines visible (growing count)
      Line.visible[entities[1]] = 1;
      Line.visible[entities[2]] = 1;
      Line.visible[entities[3]] = 1;
      Line.visible[entities[4]] = 1;
      runLineSystem(state);

      // Verify the geometry was updated to include all 5 visible lines
      const posAttr2 = batch.geometry.getAttribute('instanceStart');
      expect(posAttr2.count).toBe(5); // Should be 5, not stuck at 1
    });

    it('should handle visibility toggle pattern like token borders', () => {
      const tokenCount = 5;
      const linesPerToken = 4;
      const allLines = [];

      for (let t = 0; t < tokenCount; t++) {
        for (let l = 0; l < linesPerToken; l++) {
          const e = createLineEntity(state);
          Line.thickness[e] = 1.5;
          Line.opacity[e] = 1;
          Line.visible[e] = 0; // Start hidden
          Line.offsetX[e] = 0;
          Line.offsetY[e] = 0;
          allLines.push(e);
        }
      }

      // Frame 1: No lines visible
      runLineSystem(state);
      const context = getLineContext(state);
      const key = getMaterialKey(1.5, 1);
      let batch = context.batches.get(key);
      // Batch might exist but be invisible, or might not exist yet
      if (batch) {
        expect(batch.segments.visible).toBe(false);
      }

      // Frame 2: First token's lines become visible with small offsets
      for (let l = 0; l < linesPerToken; l++) {
        Line.visible[allLines[l]] = 1;
        Line.offsetX[allLines[l]] = 0.1 * (l + 1);
      }
      runLineSystem(state);

      batch = context.batches.get(key)!;
      expect(batch.segments.visible).toBe(true);

      const posAttr1 = batch.geometry.getAttribute('instanceStart');
      expect(posAttr1.count).toBe(4); // 4 lines visible

      // Frame 3: Second token's lines also become visible
      for (let l = 0; l < linesPerToken; l++) {
        Line.visible[allLines[linesPerToken + l]] = 1;
        Line.offsetX[allLines[linesPerToken + l]] = 0.2 * (l + 1);
      }
      runLineSystem(state);

      const posAttr2 = batch.geometry.getAttribute('instanceStart');
      expect(posAttr2.count).toBe(8); // 8 lines visible now

      // Frame 4: All tokens visible
      for (let i = 0; i < allLines.length; i++) {
        Line.visible[allLines[i]] = 1;
        Line.offsetX[allLines[i]] = 0.5;
      }
      runLineSystem(state);

      const posAttr3 = batch.geometry.getAttribute('instanceStart');
      expect(posAttr3.count).toBe(20); // All 20 lines visible
    });

    it('should shrink and grow correctly through visibility cycles', () => {
      const entities = [];
      for (let i = 0; i < 6; i++) {
        const e = createLineEntity(state);
        Line.thickness[e] = 2;
        Line.opacity[e] = 1;
        Line.offsetX[e] = i + 1;
        Line.visible[e] = 1;
        entities.push(e);
      }

      // All visible
      runLineSystem(state);
      const context = getLineContext(state);
      const key = getMaterialKey(2, 1);
      const batch = context.batches.get(key)!;
      expect(batch.geometry.getAttribute('instanceStart').count).toBe(6);

      // Shrink to 2
      Line.visible[entities[2]] = 0;
      Line.visible[entities[3]] = 0;
      Line.visible[entities[4]] = 0;
      Line.visible[entities[5]] = 0;
      runLineSystem(state);
      expect(batch.geometry.getAttribute('instanceStart').count).toBe(2);

      // Grow back to 4
      Line.visible[entities[2]] = 1;
      Line.visible[entities[3]] = 1;
      runLineSystem(state);
      expect(batch.geometry.getAttribute('instanceStart').count).toBe(4);

      // Grow to 6 again
      Line.visible[entities[4]] = 1;
      Line.visible[entities[5]] = 1;
      runLineSystem(state);
      expect(batch.geometry.getAttribute('instanceStart').count).toBe(6);
    });

    it('should clear _maxInstanceCount when growing visible line count', () => {
      const entities = [];
      for (let i = 0; i < 10; i++) {
        const e = createLineEntity(state);
        Line.thickness[e] = 1.5;
        Line.visible[e] = 0;
        Line.offsetX[e] = i + 1;
        entities.push(e);
      }

      // Frame 1: Only 2 lines visible (this sets _maxInstanceCount = 2)
      Line.visible[entities[0]] = 1;
      Line.visible[entities[1]] = 1;
      runLineSystem(state);

      const context = getLineContext(state);
      const key = getMaterialKey(1.5, 1);
      const batch = context.batches.get(key)!;

      expect(batch.geometry.getAttribute('instanceStart').count).toBe(2);

      // Frame 2: All 10 lines visible (tests _maxInstanceCount clearing)
      for (const e of entities) {
        Line.visible[e] = 1;
      }
      runLineSystem(state);

      expect(batch.geometry.getAttribute('instanceStart').count).toBe(10);

      // Verify _maxInstanceCount was cleared (will be recalculated by renderer)
      expect(
        (batch.geometry as { _maxInstanceCount?: number })._maxInstanceCount
      ).toBeUndefined();
    });
  });
});
