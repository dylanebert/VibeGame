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
        defaults: 'src/defaults.ts',
        'plugins/animation/index': 'src/plugins/animation/index.ts',
        'plugins/input/index': 'src/plugins/input/index.ts',
        'plugins/orbit-camera/index': 'src/plugins/orbit-camera/index.ts',
        'plugins/physics/index': 'src/plugins/physics/index.ts',
        'plugins/player/index': 'src/plugins/player/index.ts',
        'plugins/postprocessing/index': 'src/plugins/postprocessing/index.ts',
        'plugins/rendering/index': 'src/plugins/rendering/index.ts',
        'plugins/text/index': 'src/plugins/text/index.ts',
        'plugins/respawn/index': 'src/plugins/respawn/index.ts',
        'plugins/startup/index': 'src/plugins/startup/index.ts',
        'plugins/transforms/index': 'src/plugins/transforms/index.ts',
        'plugins/tweening/index': 'src/plugins/tweening/index.ts',
        'plugins/line/index': 'src/plugins/line/index.ts',
        'vite/index': 'src/vite/index.ts',
        'cli/index': 'src/cli/index.ts',
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
        '@dimforge/rapier3d-compat',
        'troika-three-text',
        /^three\//,
        'jsdom',
        '@fredli74/typr',
        'fs/promises',
      ],
      output: {
        globals: {
          three: 'THREE',
          bitecs: 'bitECS',
        },
        exports: 'named',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
    sourcemap: true,
    target: 'esnext',
    minify: 'esbuild',
  },
});
