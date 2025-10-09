import type { State } from '../../core';
import type { NetworkState } from './types';

const stateToNetworkState = new WeakMap<State, NetworkState>();

export function getNetworkState(state: State): NetworkState {
  let netState = stateToNetworkState.get(state);
  if (!netState) {
    netState = {
      networkIdToEntity: new Map(),
      entityToNetworkId: new Map(),
      initializedEntities: new Set(),
      remoteEntities: new Set(),
      pendingNetworkIdRequests: new Set(),
    };
    stateToNetworkState.set(state, netState);
  }
  return netState;
}
