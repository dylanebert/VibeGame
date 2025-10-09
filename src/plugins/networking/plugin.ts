import type { Plugin } from '../../core';
import { Networked, Owned } from './components';
import {
  NetworkBufferConsumeSystem,
  NetworkCleanupSystem,
  NetworkInitSystem,
  NetworkSendSystem,
  NetworkStructuralSendSystem,
  NetworkSyncSystem,
} from './systems';

export const NetworkingPlugin: Plugin = {
  components: {
    Owned,
    Networked,
  },
  systems: [
    NetworkInitSystem,
    NetworkStructuralSendSystem,
    NetworkSyncSystem,
    NetworkBufferConsumeSystem,
    NetworkSendSystem,
    NetworkCleanupSystem,
  ],
};
