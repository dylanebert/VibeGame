import { beforeEach, describe, expect, it } from 'bun:test';
import { State } from 'vibegame';
import {
  getTextContext,
  setTextContent,
  getTextContent,
  TextPlugin,
} from 'vibegame/text';

describe('Text Utils', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TextPlugin);
  });

  it('should create context on first access', () => {
    const context = getTextContext(state);
    expect(context).toBeDefined();
    expect(context.textMeshes).toBeDefined();
    expect(context.textContent).toBeDefined();
  });

  it('should return same context on subsequent accesses', () => {
    const context1 = getTextContext(state);
    const context2 = getTextContext(state);
    expect(context1).toBe(context2);
  });

  it('should store and retrieve text content', () => {
    const entity = state.createEntity();
    setTextContent(state, entity, 'Hello World');
    expect(getTextContent(state, entity)).toBe('Hello World');
  });

  it('should return empty string for unset content', () => {
    const entity = state.createEntity();
    expect(getTextContent(state, entity)).toBe('');
  });

  it('should handle multiple entities with different content', () => {
    const entity1 = state.createEntity();
    const entity2 = state.createEntity();

    setTextContent(state, entity1, 'Text One');
    setTextContent(state, entity2, 'Text Two');

    expect(getTextContent(state, entity1)).toBe('Text One');
    expect(getTextContent(state, entity2)).toBe('Text Two');
  });

  it('should update existing text content', () => {
    const entity = state.createEntity();

    setTextContent(state, entity, 'Initial');
    expect(getTextContent(state, entity)).toBe('Initial');

    setTextContent(state, entity, 'Updated');
    expect(getTextContent(state, entity)).toBe('Updated');
  });

  it('should handle empty string content', () => {
    const entity = state.createEntity();

    setTextContent(state, entity, '');
    expect(getTextContent(state, entity)).toBe('');
  });

  it('should handle unicode text content', () => {
    const entity = state.createEntity();

    setTextContent(state, entity, 'Hello 世界 🌍');
    expect(getTextContent(state, entity)).toBe('Hello 世界 🌍');
  });

  it('should create separate contexts for different states', () => {
    const state1 = new State();
    const state2 = new State();
    state1.registerPlugin(TextPlugin);
    state2.registerPlugin(TextPlugin);

    const context1 = getTextContext(state1);
    const context2 = getTextContext(state2);

    expect(context1).not.toBe(context2);
  });
});
