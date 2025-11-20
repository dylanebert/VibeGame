import { defineConfig } from 'vite';
import { vibegame, consoleForwarding } from 'vibegame/vite';

export default defineConfig({
  plugins: [vibegame(), consoleForwarding()],
  server: {
    port: 3002,
    open: true,
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
});
