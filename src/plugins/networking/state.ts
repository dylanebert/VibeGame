import type { State } from '../../core';
import type { NetworkState } from './types';

const stateToNetworkState = new WeakMap<State, NetworkState>();

export function getNetworkState(state: State): NetworkState {
  let netState = stateToNetworkState.get(state);
  if (!netState) {
    netState = {
      compositeKeyToEntity: new Map(),
    };
    stateToNetworkState.set(state, netState);
  }
  return netState;
}
