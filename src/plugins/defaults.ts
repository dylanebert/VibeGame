import type { Plugin } from '../core';
import { AnimationPlugin } from './animation/plugin';
import { InputPlugin } from './input/plugin';
import { OrbitCameraPlugin } from './orbit-camera/plugin';
import { PhysicsPlugin } from './physics/plugin';
import { PlayerPlugin } from './player/plugin';
import { RenderingPlugin } from './rendering/plugin';
import { RespawnPlugin } from './respawn/plugin';
import { StartupPlugin } from './startup/plugin';
import { TransformsPlugin } from './transforms';
import { TweenPlugin } from './tweening';

export const DefaultPlugins: Plugin[] = [
  TweenPlugin,
  TransformsPlugin,
  AnimationPlugin,
  InputPlugin,
  PhysicsPlugin,
  RenderingPlugin,
  OrbitCameraPlugin,
  PlayerPlugin,
  StartupPlugin,
  RespawnPlugin,
];
