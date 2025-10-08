import type { Plugin } from '../../core';
import { Networked, Owned } from './components';
import {
  NetworkBufferConsumeSystem,
  NetworkCleanupSystem,
  NetworkInitSystem,
  NetworkSendSystem,
  NetworkSyncSystem,
} from './systems';

export const NetworkingPlugin: Plugin = {
  components: {
    Owned,
    Networked,
  },
  systems: [
    NetworkInitSystem,
    NetworkSyncSystem,
    NetworkBufferConsumeSystem,
    NetworkSendSystem,
    NetworkCleanupSystem,
  ],
};
