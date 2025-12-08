import type { State } from '../../core';
import type { Text as TroikaText } from 'troika-three-text';
import { Word, Align } from './components';

export type MeasureFn = (text: string, fontSize: number) => number;

export interface TextContext {
  textMeshes: Map<number, TroikaText>;
  textContent: Map<number, string>;
  defaultFont: string | null;
  measureFn: MeasureFn | null;
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
      measureFn: null,
    };
    stateToTextContext.set(state, context);
  }
  return context;
}

export function setMeasureFn(state: State, fn: MeasureFn): void {
  getTextContext(state).measureFn = fn;
}

export function measureWordWidth(state: State, entity: number): number {
  const context = getTextContext(state);
  const text = context.textContent.get(entity) || '';
  const fontSize = Word.fontSize[entity];

  if (context.measureFn) {
    return context.measureFn(text, fontSize);
  }

  const textMesh = context.textMeshes.get(entity);
  if (textMesh?.textRenderInfo) {
    const [minX, , maxX] = textMesh.textRenderInfo.blockBounds;
    return maxX - minX;
  }

  return 0;
}

export function setTextContent(
  state: State,
  entity: number,
  text: string
): void {
  const context = getTextContext(state);
  context.textContent.set(entity, text);
  Word.dirty[entity] = 1;
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
    if (context.measureFn) {
      const text = context.textContent.get(entity) || '';
      const fontSize = Word.fontSize[entity];
      const width = context.measureFn(text, fontSize);
      const height = fontSize;
      callback({
        width,
        height,
        blockBounds: [0, 0, width, height],
        visibleBounds: [0, 0, width, height],
      });
    }
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

export function wordPosition(
  widths: number[],
  gap: number,
  align: Align,
  index: number
): number {
  const totalWidth =
    widths.reduce((sum, w) => sum + w, 0) + (widths.length - 1) * gap;

  let offset = 0;
  for (let i = 0; i < index; i++) {
    offset += widths[i] + gap;
  }
  offset += widths[index] / 2;

  let startX: number;
  switch (align) {
    case Align.Left:
      startX = 0;
      break;
    case Align.Right:
      startX = -totalWidth;
      break;
    case Align.Center:
    default:
      startX = -totalWidth / 2;
      break;
  }

  return startX + offset;
}
