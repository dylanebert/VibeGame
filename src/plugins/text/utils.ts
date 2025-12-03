import type { State } from '../../core';
import type { Text } from 'troika-three-text';

export interface TextContext {
  textMeshes: Map<number, Text>;
  textContent: Map<number, string>;
  defaultFont: string | null;
}

const stateToTextContext = new WeakMap<State, TextContext>();

export function getTextContext(state: State): TextContext {
  let context = stateToTextContext.get(state);
  if (!context) {
    context = {
      textMeshes: new Map(),
      textContent: new Map(),
      defaultFont: null,
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

export function setDefaultFont(state: State, fontUrl: string | null): void {
  const context = getTextContext(state);
  context.defaultFont = fontUrl;
}
