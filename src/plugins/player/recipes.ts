import type { Recipe } from '../../core';
import { PLAYER_BODY_DEFAULTS, PLAYER_COLLIDER_DEFAULTS } from './constants';

export const playerRecipe: Recipe = {
  name: 'player',
  components: [
    'player',
    'character-movement',
    'transform',
    'body',
    'collider',
    'character-controller',
    'input-state',
    'respawn',
  ],
  overrides: {
    'body.eulerY': PLAYER_BODY_DEFAULTS.eulerY,
    'body.type': PLAYER_BODY_DEFAULTS.type,
    'body.ccd': PLAYER_BODY_DEFAULTS.ccd,
    'body.lock-rot-x': PLAYER_BODY_DEFAULTS.lockRotX,
    'body.lock-rot-z': PLAYER_BODY_DEFAULTS.lockRotZ,
    'collider.shape': PLAYER_COLLIDER_DEFAULTS.shape,
    'collider.radius': PLAYER_COLLIDER_DEFAULTS.radius,
    'collider.height': PLAYER_COLLIDER_DEFAULTS.height,
    'collider.friction': PLAYER_COLLIDER_DEFAULTS.friction,
    'collider.pos-offset-y': PLAYER_COLLIDER_DEFAULTS.posOffsetY,
  },
};
