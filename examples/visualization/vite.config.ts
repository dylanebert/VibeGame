import { defineConfig } from 'vite';
import { consoleForwarding } from 'vibegame/vite';

export default defineConfig({
  plugins: [consoleForwarding()],
  server: {
    port: 3001,
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
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    exclude: ['vibegame'],
  },
});
