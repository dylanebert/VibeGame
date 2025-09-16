import type { GameRuntime } from '../runtime';

const activeRuntimes: GameRuntime[] = [];

export function registerRuntime(runtime: GameRuntime): void {
  activeRuntimes.push(runtime);
}

export function unregisterRuntime(runtime: GameRuntime): void {
  const index = activeRuntimes.indexOf(runtime);
  if (index !== -1) {
    activeRuntimes.splice(index, 1);
  }
}

export function disposeAllRuntimes(): void {
  if (activeRuntimes.length > 0) {
    console.warn(
      `[VibeGame] Disposing ${activeRuntimes.length} active runtime(s)`
    );
    for (const runtime of activeRuntimes) {
      try {
        runtime.destroy();
      } catch (error) {
        console.error('[VibeGame] Failed to dispose runtime:', error);
      }
    }
    activeRuntimes.length = 0;
  }
}
