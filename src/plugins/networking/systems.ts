import { Client } from 'colyseus.js';
import type { System } from '../../core';

const NETWORK_URL = 'ws://localhost:2567';

let isConnecting = false;

export const NetworkConnectionSystem: System = {
  group: 'setup',
  first: true,
  setup(state) {
    if (!state.room && !isConnecting) {
      isConnecting = true;
      (async () => {
        try {
          const client = new Client(NETWORK_URL);
          const room = await client.joinOrCreate('game');

          state.room = room;
          state.clientId = parseInt(room.sessionId, 36);
          state.context = 'client';

          console.log('[Networking] Connected to', NETWORK_URL);
          console.log('[Networking] Client ID:', state.clientId);

          room.onMessage('*', (type, message) => {
            console.log('[Networking] Received:', type, message);
          });

          room.onLeave(() => {
            console.log('[Networking] Disconnected from server');
          });
        } catch (error) {
          console.error('[Networking] Connection failed:', error);
          isConnecting = false;
        }
      })();
    }
  },
};
