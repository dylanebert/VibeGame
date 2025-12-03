import type { State } from '../../core';
import type { Text } from 'troika-three-text';

export interface TextContext {
  textMeshes: Map<number, Text>;
  textContent: Map<number, string>;
}

const stateToTextContext = new WeakMap<State, TextContext>();

export function getTextContext(state: State): TextContext {
  let context = stateToTextContext.get(state);
  if (!context) {
    context = {
      textMeshes: new Map(),
      textContent: new Map(),
    };
    stateToTextContext.set(state, context);
  }
  return context;
}

export function setTextContent(
  state: State,
  entity: number,
  text: string
): void {
  const context = getTextContext(state);
  context.textContent.set(entity, text);
}

export function getTextContent(state: State, entity: number): string {
  const context = getTextContext(state);
  return context.textContent.get(entity) || '';
}
