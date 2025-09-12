import type { Plugin } from '../../core';
import {
  CameraStartupSystem,
  LightingStartupSystem,
  PlayerCharacterSystem,
  PlayerStartupSystem,
} from './systems';

export const StartupPlugin: Plugin = {
  systems: [
    LightingStartupSystem,
    CameraStartupSystem,
    PlayerStartupSystem,
    PlayerCharacterSystem,
  ],
  components: {},
};
