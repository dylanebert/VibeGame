import type { State } from '../../core';
import type { Text as TroikaText } from 'troika-three-text';
import { Text } from './components';

export interface TextContext {
  textMeshes: Map<number, TroikaText>;
  textContent: Map<number, string>;
  defaultFont: string | null;
}

export interface TextBounds {
  width: number;
  height: number;
  blockBounds: [number, number, number, number];
  visibleBounds: [number, number, number, number];
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
  Text.dirty[entity] = 1;
}

export function getTextContent(state: State, entity: number): string {
  const context = getTextContext(state);
  return context.textContent.get(entity) || '';
}

export function setDefaultFont(state: State, fontUrl: string | null): void {
  const context = getTextContext(state);
  context.defaultFont = fontUrl;
}

export function measureText(
  state: State,
  entity: number,
  callback: (bounds: TextBounds) => void
): void {
  const context = getTextContext(state);
  const textMesh = context.textMeshes.get(entity);

  if (!textMesh) {
    console.warn(`measureText: No text mesh found for entity ${entity}`);
    return;
  }

  const tryGetBounds = () => {
    const info = textMesh.textRenderInfo;
    if (info) {
      const [minX, minY, maxX, maxY] = info.blockBounds;
      callback({
        width: maxX - minX,
        height: maxY - minY,
        blockBounds: info.blockBounds,
        visibleBounds: info.visibleBounds,
      });
    }
  };

  if (textMesh.textRenderInfo) {
    tryGetBounds();
  } else {
    textMesh.sync(tryGetBounds);
  }
}
