import type { Plugin } from '../core';
import { PhysicsPlugin } from '../plugins/physics/plugin';
import { RenderingPlugin } from '../plugins/rendering/plugin';
import { TransformsPlugin } from '../plugins/transforms/plugin';

function componentsOnly(plugin: Plugin): Plugin {
  return {
    components: plugin.components,
    recipes: plugin.recipes,
    config: plugin.config,
    networked: plugin.networked,
  };
}

export const ServerPlugins: Plugin[] = [
  PhysicsPlugin,
  TransformsPlugin,
  componentsOnly(RenderingPlugin),
];
