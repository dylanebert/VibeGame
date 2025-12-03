import { beforeEach, describe, expect, it } from 'bun:test';
import { State, defineQuery } from 'vibegame';
import { Text, TextPlugin } from 'vibegame/text';

describe('Text Components', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TextPlugin);
  });

  it('should register Text component', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Text);
    expect(state.hasComponent(entity, Text)).toBe(true);
  });

  it('should create Text component with proper field access', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Text);

    Text.fontSize[entity] = 2.0;
    Text.color[entity] = 0xff0000;
    Text.anchorX[entity] = 1;
    Text.anchorY[entity] = 1;
    Text.textAlign[entity] = 0;
    Text.maxWidth[entity] = 10;
    Text.lineHeight[entity] = 1.5;
    Text.dirty[entity] = 1;

    expect(Text.fontSize[entity]).toBe(2.0);
    expect(Text.color[entity]).toBe(0xff0000);
    expect(Text.anchorX[entity]).toBe(1);
    expect(Text.anchorY[entity]).toBe(1);
    expect(Text.textAlign[entity]).toBe(0);
    expect(Text.maxWidth[entity]).toBe(10);
    expect(Text.lineHeight[entity]).toBeCloseTo(1.5);
    expect(Text.dirty[entity]).toBe(1);
  });

  it('should handle anchor enum values', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Text);

    Text.anchorX[entity] = 0;
    expect(Text.anchorX[entity]).toBe(0);

    Text.anchorX[entity] = 1;
    expect(Text.anchorX[entity]).toBe(1);

    Text.anchorX[entity] = 2;
    expect(Text.anchorX[entity]).toBe(2);
  });

  it('should handle textAlign enum values', () => {
    const entity = state.createEntity();
    state.addComponent(entity, Text);

    Text.textAlign[entity] = 0;
    expect(Text.textAlign[entity]).toBe(0);

    Text.textAlign[entity] = 1;
    expect(Text.textAlign[entity]).toBe(1);

    Text.textAlign[entity] = 2;
    expect(Text.textAlign[entity]).toBe(2);

    Text.textAlign[entity] = 3;
    expect(Text.textAlign[entity]).toBe(3);
  });

  it('should support component queries', () => {
    const entity1 = state.createEntity();
    const entity2 = state.createEntity();

    state.addComponent(entity1, Text);
    state.addComponent(entity2, Text);

    const textQuery = defineQuery([Text])(state.world);
    expect(textQuery).toContain(entity1);
    expect(textQuery).toContain(entity2);
  });

  it('should handle multiple text entities with different colors', () => {
    const entity1 = state.createEntity();
    const entity2 = state.createEntity();

    state.addComponent(entity1, Text);
    state.addComponent(entity2, Text);

    Text.color[entity1] = 0xff0000;
    Text.color[entity2] = 0x00ff00;

    expect(Text.color[entity1]).toBe(0xff0000);
    expect(Text.color[entity2]).toBe(0x00ff00);
  });
});
