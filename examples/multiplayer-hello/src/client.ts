import * as Colyseus from 'colyseus.js';
import * as GAME from 'vibegame';
import { getNetworkState, NetworkingPlugin } from 'vibegame';

const ONLINE_MODE = true;

async function main() {
  console.log('[Client] Starting game...');

  const runtime = await GAME.withPlugin(NetworkingPlugin).run();
  const state = runtime.getState();

  if (ONLINE_MODE) {
    console.log('[Client] Attempting to connect to server...');
    await connectToServer(state);
  } else {
    console.log('[Client] Running in OFFLINE mode (standalone)');
  }
}

async function connectToServer(state: GAME.State) {
  const client = new Colyseus.Client('ws://localhost:2567');

  try {
    const room = await client.joinOrCreate<any>('game');
    console.log('[Client] ✅ Connected to room');
    console.log('[Client] Session ID:', room.sessionId);

    const netState = getNetworkState(state);
    netState.room = room;

    room.onError((code, message) => {
      console.error('[Client] ❌ Error:', code, message);
    });

    room.onLeave((code) => {
      console.log('[Client] Left room with code:', code);
    });
  } catch (e) {
    console.error('[Client] ❌ Connection failed:', e);
    console.log('[Client] Continuing in offline mode...');
  }
}

main();
