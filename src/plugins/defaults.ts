import type { Plugin } from '../core';
import { RecipePlugin } from './recipes';
import { TweenPlugin } from './tweening';
import { StartupPlugin } from './startup/plugin';
import { TransformsPlugin } from './transforms';
import { AnimationPlugin } from './animation/plugin';
import { InputPlugin } from './input/plugin';
import { PhysicsPlugin } from './physics/plugin';
import { RenderingPlugin } from './rendering/plugin';
import { OrbitCameraPlugin } from './orbit-camera/plugin';
import { PlayerPlugin } from './player/plugin';
import { RespawnPlugin } from './respawn/plugin';

export const DefaultPlugins: Plugin[] = [
  RecipePlugin,
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
