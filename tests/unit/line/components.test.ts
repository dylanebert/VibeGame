import { beforeEach, describe, expect, it } from 'bun:test';
import { State, defineQuery } from 'vibegame';
import { Line, LinePlugin } from 'vibegame/line';

describe('Line Components', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(LinePlugin);
  });

  it('should register Line component', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Line);
    expect(state.hasComponent(entity, Line)).toBe(true);
  });

  it('should create Line component with proper field access', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Line);

    Line.offsetX[entity] = 5.0;
    Line.offsetY[entity] = 3.0;
    Line.offsetZ[entity] = 1.0;
    Line.color[entity] = 0xff0000;
    Line.thickness[entity] = 3.0;
    Line.opacity[entity] = 0.8;
    Line.visible[entity] = 1;
    Line.arrowStart[entity] = 0;
    Line.arrowEnd[entity] = 1;
    Line.arrowSize[entity] = 0.3;

    expect(Line.offsetX[entity]).toBe(5.0);
    expect(Line.offsetY[entity]).toBe(3.0);
    expect(Line.offsetZ[entity]).toBe(1.0);
    expect(Line.color[entity]).toBe(0xff0000);
    expect(Line.thickness[entity]).toBeCloseTo(3.0);
    expect(Line.opacity[entity]).toBeCloseTo(0.8);
    expect(Line.visible[entity]).toBe(1);
    expect(Line.arrowStart[entity]).toBe(0);
    expect(Line.arrowEnd[entity]).toBe(1);
    expect(Line.arrowSize[entity]).toBeCloseTo(0.3);
  });

  it('should handle arrow flags', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Line);

    Line.arrowStart[entity] = 0;
    Line.arrowEnd[entity] = 0;
    expect(Line.arrowStart[entity]).toBe(0);
    expect(Line.arrowEnd[entity]).toBe(0);

    Line.arrowStart[entity] = 1;
    Line.arrowEnd[entity] = 1;
    expect(Line.arrowStart[entity]).toBe(1);
    expect(Line.arrowEnd[entity]).toBe(1);
  });

  it('should handle visibility flag', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Line);

    Line.visible[entity] = 1;
    expect(Line.visible[entity]).toBe(1);

    Line.visible[entity] = 0;
    expect(Line.visible[entity]).toBe(0);
  });

  it('should support component queries', () => {
    const entity1 = state.createEntity();
    const entity2 = state.createEntity();

    state.addComponent(entity1, Line);
    state.addComponent(entity2, Line);

    const lineQuery = defineQuery([Line])(state.world);
    expect(lineQuery).toContain(entity1);
    expect(lineQuery).toContain(entity2);
  });

  it('should handle multiple line entities with different colors', () => {
    const entity1 = state.createEntity();
    const entity2 = state.createEntity();

    state.addComponent(entity1, Line);
    state.addComponent(entity2, Line);

    Line.color[entity1] = 0xff0000;
    Line.color[entity2] = 0x00ff00;

    expect(Line.color[entity1]).toBe(0xff0000);
    expect(Line.color[entity2]).toBe(0x00ff00);
  });

  it('should handle offset values correctly', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Line);

    Line.offsetX[entity] = -10.5;
    Line.offsetY[entity] = 20.25;
    Line.offsetZ[entity] = 0.0;

    expect(Line.offsetX[entity]).toBeCloseTo(-10.5);
    expect(Line.offsetY[entity]).toBeCloseTo(20.25);
    expect(Line.offsetZ[entity]).toBeCloseTo(0.0);
  });
});
