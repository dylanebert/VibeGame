import { beforeEach, describe, expect, it } from 'bun:test';
import { State, defineQuery } from 'vibegame';
import {
  Text3D,
  TextPlugin,
  setTextContent,
  getTextContent,
} from 'vibegame/text';
import {
  Transform,
  TransformsPlugin,
  WorldTransform,
} from 'vibegame/transforms';

describe('Text Plugin Integration', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
  });

  it('should register TextPlugin with State', () => {
    state.registerPlugin(TextPlugin);
    expect(true).toBe(true);
  });

  it('should process entities with Text3D component', () => {
    state.registerPlugin(TextPlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Text3D);

    Text3D.fontSize[entity] = 1.0;
    Text3D.color[entity] = 0xffffff;
    Text3D.anchorX[entity] = 1;
    Text3D.anchorY[entity] = 1;
    Text3D.dirty[entity] = 1;

    expect(state.hasComponent(entity, Text3D)).toBe(true);
  });

  it('should work with transforms for text positioning', () => {
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(TextPlugin);

    const textEntity = state.createEntity();
    state.addComponent(textEntity, Text3D);
    state.addComponent(textEntity, Transform);
    state.addComponent(textEntity, WorldTransform);

    Transform.posX[textEntity] = 5;
    Transform.posY[textEntity] = 10;
    Transform.posZ[textEntity] = 0;

    expect(state.hasComponent(textEntity, Text3D)).toBe(true);
    expect(state.hasComponent(textEntity, Transform)).toBe(true);
    expect(state.hasComponent(textEntity, WorldTransform)).toBe(true);
  });

  it('should handle text content updates', () => {
    state.registerPlugin(TextPlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Text3D);

    setTextContent(state, entity, 'Initial');
    Text3D.dirty[entity] = 1;
    expect(getTextContent(state, entity)).toBe('Initial');

    setTextContent(state, entity, 'Updated');
    Text3D.dirty[entity] = 1;
    expect(getTextContent(state, entity)).toBe('Updated');
  });

  it('should query text entities', () => {
    state.registerPlugin(TextPlugin);

    const text1 = state.createEntity();
    const text2 = state.createEntity();
    const nonText = state.createEntity();

    state.addComponent(text1, Text3D);
    state.addComponent(text2, Text3D);

    const textEntities = defineQuery([Text3D])(state.world);
    expect(textEntities).toContain(text1);
    expect(textEntities).toContain(text2);
    expect(textEntities).not.toContain(nonText);
  });

  it('should handle multiple styled text entities', () => {
    state.registerPlugin(TextPlugin);

    const entities = [];
    for (let i = 0; i < 3; i++) {
      const entity = state.createEntity();
      state.addComponent(entity, Text3D);

      Text3D.fontSize[entity] = i + 1;
      Text3D.color[entity] = 0xff0000 + i * 0x001100;
      setTextContent(state, entity, `Text ${i}`);

      entities.push(entity);
    }

    for (let i = 0; i < entities.length; i++) {
      expect(Text3D.fontSize[entities[i]]).toBe(i + 1);
      expect(getTextContent(state, entities[i])).toBe(`Text ${i}`);
    }
  });

  it('should handle anchor configuration', () => {
    state.registerPlugin(TextPlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Text3D);

    Text3D.anchorX[entity] = 0;
    Text3D.anchorY[entity] = 0;
    expect(Text3D.anchorX[entity]).toBe(0);
    expect(Text3D.anchorY[entity]).toBe(0);

    Text3D.anchorX[entity] = 2;
    Text3D.anchorY[entity] = 2;
    expect(Text3D.anchorX[entity]).toBe(2);
    expect(Text3D.anchorY[entity]).toBe(2);
  });

  it('should handle text alignment configuration', () => {
    state.registerPlugin(TextPlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Text3D);

    Text3D.textAlign[entity] = 0;
    expect(Text3D.textAlign[entity]).toBe(0);

    Text3D.textAlign[entity] = 3;
    expect(Text3D.textAlign[entity]).toBe(3);
  });

  it('should handle maxWidth for text wrapping', () => {
    state.registerPlugin(TextPlugin);

    const entity = state.createEntity();
    state.addComponent(entity, Text3D);

    Text3D.maxWidth[entity] = 0;
    expect(Text3D.maxWidth[entity]).toBe(0);

    Text3D.maxWidth[entity] = 10;
    expect(Text3D.maxWidth[entity]).toBe(10);
  });

  it('should support combined query with WorldTransform', () => {
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(TextPlugin);

    const text1 = state.createEntity();
    const text2 = state.createEntity();

    state.addComponent(text1, Text3D);
    state.addComponent(text1, Transform);
    state.addComponent(text1, WorldTransform);

    state.addComponent(text2, Text3D);

    const textWithTransform = defineQuery([Text3D, WorldTransform])(
      state.world
    );
    expect(textWithTransform).toContain(text1);
    expect(textWithTransform).not.toContain(text2);
  });
});
