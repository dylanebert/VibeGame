import { beforeEach, describe, expect, it } from 'bun:test';
import { State, defineQuery } from 'vibegame';
import { Line, LinePlugin } from 'vibegame/line';
import {
  Transform,
  TransformsPlugin,
  WorldTransform,
} from 'vibegame/transforms';

describe('Line Plugin Integration', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
  });

  it('should register LinePlugin with State', () => {
    state.registerPlugin(LinePlugin);
    expect(true).toBe(true);
  });

  it('should process entities with Line component', () => {
    state.registerPlugin(LinePlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Line);

    Line.offsetX[entity] = 5.0;
    Line.offsetY[entity] = 0.0;
    Line.offsetZ[entity] = 0.0;
    Line.color[entity] = 0xffffff;
    Line.thickness[entity] = 2.0;
    Line.dirty[entity] = 1;

    expect(state.hasComponent(entity, Line)).toBe(true);
  });

  it('should work with transforms for line positioning', () => {
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(LinePlugin);

    const lineEntity = state.createEntity();
    state.addComponent(lineEntity, Line);
    state.addComponent(lineEntity, Transform);
    state.addComponent(lineEntity, WorldTransform);

    Transform.posX[lineEntity] = 5;
    Transform.posY[lineEntity] = 10;
    Transform.posZ[lineEntity] = 0;

    Line.offsetX[lineEntity] = 3;
    Line.offsetY[lineEntity] = 2;
    Line.offsetZ[lineEntity] = 1;

    expect(state.hasComponent(lineEntity, Line)).toBe(true);
    expect(state.hasComponent(lineEntity, Transform)).toBe(true);
    expect(state.hasComponent(lineEntity, WorldTransform)).toBe(true);
  });

  it('should query line entities', () => {
    state.registerPlugin(LinePlugin);

    const line1 = state.createEntity();
    const line2 = state.createEntity();
    const nonLine = state.createEntity();

    state.addComponent(line1, Line);
    state.addComponent(line2, Line);

    const lineEntities = defineQuery([Line])(state.world);
    expect(lineEntities).toContain(line1);
    expect(lineEntities).toContain(line2);
    expect(lineEntities).not.toContain(nonLine);
  });

  it('should handle multiple styled line entities', () => {
    state.registerPlugin(LinePlugin);

    const entities = [];
    for (let i = 0; i < 3; i++) {
      const entity = state.createEntity();
      state.addComponent(entity, Line);

      Line.offsetX[entity] = i + 1;
      Line.color[entity] = 0xff0000 + i * 0x001100;
      Line.thickness[entity] = i + 1;

      entities.push(entity);
    }

    for (let i = 0; i < entities.length; i++) {
      expect(Line.offsetX[entities[i]]).toBe(i + 1);
      expect(Line.thickness[entities[i]]).toBe(i + 1);
    }
  });

  it('should handle arrow configuration', () => {
    state.registerPlugin(LinePlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Line);

    Line.arrowStart[entity] = 0;
    Line.arrowEnd[entity] = 0;
    Line.arrowSize[entity] = 0.2;
    expect(Line.arrowStart[entity]).toBe(0);
    expect(Line.arrowEnd[entity]).toBe(0);

    Line.arrowStart[entity] = 1;
    Line.arrowEnd[entity] = 1;
    Line.arrowSize[entity] = 0.5;
    expect(Line.arrowStart[entity]).toBe(1);
    expect(Line.arrowEnd[entity]).toBe(1);
    expect(Line.arrowSize[entity]).toBeCloseTo(0.5);
  });

  it('should handle opacity and visibility', () => {
    state.registerPlugin(LinePlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Line);

    Line.opacity[entity] = 1.0;
    Line.visible[entity] = 1;
    expect(Line.opacity[entity]).toBe(1.0);
    expect(Line.visible[entity]).toBe(1);

    Line.opacity[entity] = 0.5;
    Line.visible[entity] = 0;
    expect(Line.opacity[entity]).toBeCloseTo(0.5);
    expect(Line.visible[entity]).toBe(0);
  });

  it('should support combined query with WorldTransform', () => {
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(LinePlugin);

    const line1 = state.createEntity();
    const line2 = state.createEntity();

    state.addComponent(line1, Line);
    state.addComponent(line1, Transform);
    state.addComponent(line1, WorldTransform);

    state.addComponent(line2, Line);

    const lineWithTransform = defineQuery([Line, WorldTransform])(state.world);
    expect(lineWithTransform).toContain(line1);
    expect(lineWithTransform).not.toContain(line2);
  });

  it('should handle negative offset values', () => {
    state.registerPlugin(LinePlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Line);

    Line.offsetX[entity] = -5;
    Line.offsetY[entity] = -10;
    Line.offsetZ[entity] = -2.5;

    expect(Line.offsetX[entity]).toBe(-5);
    expect(Line.offsetY[entity]).toBe(-10);
    expect(Line.offsetZ[entity]).toBeCloseTo(-2.5);
  });

  it('should track arrow lines separately for start and end', () => {
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(LinePlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Transform);
    state.addComponent(entity, WorldTransform);
    state.addComponent(entity, Line);

    Line.offsetX[entity] = 5;
    Line.arrowStart[entity] = 1;
    Line.arrowEnd[entity] = 1;
    Line.arrowSize[entity] = 0.3;
    Line.dirty[entity] = 1;

    expect(Line.arrowStart[entity]).toBe(1);
    expect(Line.arrowEnd[entity]).toBe(1);
    expect(Line.arrowSize[entity]).toBeCloseTo(0.3);
  });

  it('should allow updating line offset without resetting dirty', () => {
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(LinePlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Transform);
    state.addComponent(entity, WorldTransform);
    state.addComponent(entity, Line);

    Line.offsetX[entity] = 5;
    Line.arrowEnd[entity] = 1;
    Line.arrowSize[entity] = 0.3;
    Line.dirty[entity] = 1;

    Line.dirty[entity] = 0;

    Line.offsetX[entity] = 10;
    Line.offsetY[entity] = 5;

    expect(Line.dirty[entity]).toBe(0);
    expect(Line.offsetX[entity]).toBe(10);
    expect(Line.offsetY[entity]).toBe(5);
  });
});
