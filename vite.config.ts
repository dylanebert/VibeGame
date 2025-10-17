import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      rollupTypes: false,
      insertTypesEntry: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
    }),
  ],
  resolve: {
    alias: {
      '@dimforge/rapier3d': '@dimforge/rapier3d-compat',
    },
  },
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'vite/index': 'src/vite/index.ts',
        'server/index': 'src/server/index.ts',
      },
      name: 'VibeGame',
      fileName: (format, entryName) =>
        `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'three',
        'bitecs',
        'vite',
        'colyseus',
        'colyseus.js',
        '@colyseus/ws-transport',
      ],
      output: {
        globals: {
          three: 'THREE',
          bitecs: 'bitECS',
        },
        exports: 'named',
      },
    },
    sourcemap: true,
    target: 'esnext',
    minify: 'esbuild',
  },
});
