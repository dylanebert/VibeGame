import type { Plugin } from 'vite';

export function vibegame(): Plugin[] {
  return [
    {
      name: 'vibegame',
      config: (config) => {
        config.resolve = config.resolve || {};
        config.resolve.alias = {
          ...config.resolve.alias,
          '@dimforge/rapier3d': '@dimforge/rapier3d-compat',
        };
      },
    },
  ];
}

export { consoleForwarding } from './console-plugin';
