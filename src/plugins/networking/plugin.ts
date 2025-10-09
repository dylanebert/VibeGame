import type { Plugin } from '../../core';
import {
  ClientAuthority,
  NetworkIdentity,
  RemoteSnapshot,
  ServerAuthority,
} from './components';
import {
  NetworkAuthorityCleanupSystem,
  NetworkBufferConsumeSystem,
  NetworkCleanupSystem,
  NetworkInitSystem,
  NetworkSendSystem,
  NetworkStructuralSendSystem,
  NetworkSyncSystem,
} from './systems';

export const NetworkingPlugin: Plugin = {
  components: {
    NetworkIdentity,
    ClientAuthority,
    ServerAuthority,
    RemoteSnapshot,
  },
  systems: [
    NetworkInitSystem,
    NetworkAuthorityCleanupSystem,
    NetworkStructuralSendSystem,
    NetworkSyncSystem,
    NetworkBufferConsumeSystem,
    NetworkSendSystem,
    NetworkCleanupSystem,
  ],
};
