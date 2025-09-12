import type { Plugin } from '../../core';
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
        headEntity: -1,
        torsoEntity: -1,
        leftArmEntity: -1,
        rightArmEntity: -1,
        leftLegEntity: -1,
        rightLegEntity: -1,
        phase: 0,
        jumpTime: 0,
        fallTime: 0,
        animationState: 0,
        stateTransition: 0,
      },
    },
  },
};
