import type { Line2 } from 'three/examples/jsm/lines/Line2.js';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { State } from '../../core';

export interface LineEntry {
  line: Line2;
  arrowStartLines: Line2[];
  arrowEndLines: Line2[];
}

export interface LineContext {
  lines: Map<number, LineEntry>;
  material: LineMaterial | null;
}

const stateToLineContext = new WeakMap<State, LineContext>();

export function getLineContext(state: State): LineContext {
  let context = stateToLineContext.get(state);
  if (!context) {
    context = {
      lines: new Map(),
      material: null,
    };
    stateToLineContext.set(state, context);
  }
  return context;
}
