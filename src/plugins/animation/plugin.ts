import { NULL_ENTITY, type Plugin } from '../../core';
import { AnimatedCharacter, HasAnimator } from './components';
import {
  AnimatedCharacterInitializationSystem,
  AnimatedCharacterUpdateSystem,
} from './systems';

export const AnimationPlugin: Plugin = {
  systems: [
    AnimatedCharacterInitializationSystem,
    AnimatedCharacterUpdateSystem,
  ],
  components: {
    AnimatedCharacter,
    HasAnimator,
  },
  config: {
    defaults: {
      'animated-character': {
        headEntity: NULL_ENTITY,
        torsoEntity: NULL_ENTITY,
        leftArmEntity: NULL_ENTITY,
        rightArmEntity: NULL_ENTITY,
        leftLegEntity: NULL_ENTITY,
        rightLegEntity: NULL_ENTITY,
        phase: 0,
        jumpTime: 0,
        fallTime: 0,
        animationState: 0,
        stateTransition: 0,
      },
    },
  },
};
