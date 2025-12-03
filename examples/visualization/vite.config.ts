import { defineConfig, type Plugin } from 'vite';
import { vibegame, consoleForwarding } from 'vibegame/vite';
import * as path from 'path';
import * as fs from 'fs';

function htmlInclude(): Plugin {
  return {
    name: 'html-include',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const dir = path.dirname(ctx.filename);
        return html.replace(/<include\s+src="([^"]+)"[^>]*><\/include>/g, (_, src) => {
          const filePath = path.resolve(dir, src);
          return fs.readFileSync(filePath, 'utf-8');
        });
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [htmlInclude(), vibegame(), consoleForwarding()],
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
      input: {
        main: path.resolve(__dirname, 'index.html'),
        record: path.resolve(__dirname, 'record.html'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['vibegame'],
  },
});
