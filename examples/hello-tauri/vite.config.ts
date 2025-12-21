import { consoleForwarding, vibegame } from 'vibegame/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vibegame(), consoleForwarding()],
  server: {
    port: 3000,
    strictPort: true,
    fs: {
      allow: ['..'],
    },
    watch: {
      ignored: ['!**/node_modules/vibegame/**'],
    },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['vibegame'],
  },
  clearScreen: false,
});
