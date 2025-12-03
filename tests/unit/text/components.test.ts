import { beforeEach, describe, expect, it } from 'bun:test';
import { State, defineQuery } from 'vibegame';
import { Text3D, TextPlugin } from 'vibegame/text';

describe('Text3D Components', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TextPlugin);
  });

  it('should register Text3D component', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Text3D);
    expect(state.hasComponent(entity, Text3D)).toBe(true);
  });

  it('should create Text3D component with proper field access', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Text3D);

    Text3D.fontSize[entity] = 2.0;
    Text3D.color[entity] = 0xff0000;
    Text3D.anchorX[entity] = 1;
    Text3D.anchorY[entity] = 1;
    Text3D.textAlign[entity] = 0;
    Text3D.maxWidth[entity] = 10;
    Text3D.lineHeight[entity] = 1.5;
    Text3D.dirty[entity] = 1;

    expect(Text3D.fontSize[entity]).toBe(2.0);
    expect(Text3D.color[entity]).toBe(0xff0000);
    expect(Text3D.anchorX[entity]).toBe(1);
    expect(Text3D.anchorY[entity]).toBe(1);
    expect(Text3D.textAlign[entity]).toBe(0);
    expect(Text3D.maxWidth[entity]).toBe(10);
    expect(Text3D.lineHeight[entity]).toBeCloseTo(1.5);
    expect(Text3D.dirty[entity]).toBe(1);
  });

  it('should handle anchor enum values', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Text3D);

    Text3D.anchorX[entity] = 0;
    expect(Text3D.anchorX[entity]).toBe(0);

    Text3D.anchorX[entity] = 1;
    expect(Text3D.anchorX[entity]).toBe(1);

    Text3D.anchorX[entity] = 2;
    expect(Text3D.anchorX[entity]).toBe(2);
  });

  it('should handle textAlign enum values', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Text3D);

    Text3D.textAlign[entity] = 0;
    expect(Text3D.textAlign[entity]).toBe(0);

    Text3D.textAlign[entity] = 1;
    expect(Text3D.textAlign[entity]).toBe(1);

    Text3D.textAlign[entity] = 2;
    expect(Text3D.textAlign[entity]).toBe(2);

    Text3D.textAlign[entity] = 3;
    expect(Text3D.textAlign[entity]).toBe(3);
  });

  it('should support component queries', () => {
    const entity1 = state.createEntity();
    const entity2 = state.createEntity();

    state.addComponent(entity1, Text3D);
    state.addComponent(entity2, Text3D);

    const textQuery = defineQuery([Text3D])(state.world);
    expect(textQuery).toContain(entity1);
    expect(textQuery).toContain(entity2);
  });

  it('should handle multiple text entities with different colors', () => {
    const entity1 = state.createEntity();
    const entity2 = state.createEntity();

    state.addComponent(entity1, Text3D);
    state.addComponent(entity2, Text3D);

    Text3D.color[entity1] = 0xff0000;
    Text3D.color[entity2] = 0x00ff00;

    expect(Text3D.color[entity1]).toBe(0xff0000);
    expect(Text3D.color[entity2]).toBe(0x00ff00);
  });
});
