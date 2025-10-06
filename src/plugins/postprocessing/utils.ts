import type { State } from '../../core';
import type { EffectComposer } from 'postprocessing';
import type { Effect } from 'postprocessing';

export interface PostprocessingContext {
  composers: Map<number, EffectComposer>;
  effects: Map<number, Map<string, Effect>>;
}

const stateToPostprocessingContext = new WeakMap<
  State,
  PostprocessingContext
>();

export function getPostprocessingContext(state: State): PostprocessingContext {
  let context = stateToPostprocessingContext.get(state);
  if (!context) {
    context = {
      composers: new Map(),
      effects: new Map(),
    };
    stateToPostprocessingContext.set(state, context);
  }
  return context;
}
