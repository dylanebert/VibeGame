import { Client } from 'colyseus.js';

const PORT = 2567;
const SERVER_URL = `ws://localhost:${PORT}`;
const MAX_RETRIES = 10;
const RETRY_DELAY = 1000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testConnection() {
  console.log('[Test] Connecting to server at', SERVER_URL);
  console.log(
    '[Test] Make sure server is running: bun run server (in another terminal)'
  );

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = new Client(SERVER_URL);
      const room = await client.joinOrCreate('game');

      console.log(`[Test] ✓ Connected to room: ${room.roomId}`);
      console.log(`[Test] ✓ Session ID: ${room.sessionId}`);

      await room.leave();
      console.log('[Test] ✓ Disconnected successfully');
      console.log('[Test] ✓ All tests passed!');
      process.exit(0);
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.log(
          `[Test] Connection failed (attempt ${attempt}/${MAX_RETRIES}), retrying...`
        );
        await sleep(RETRY_DELAY);
      } else {
        console.error('[Test] ✗ Connection failed after all retries:', error);
        console.error('[Test] ✗ Is the server running? Run: bun run server');
        process.exit(1);
      }
    }
  }
}

testConnection();
