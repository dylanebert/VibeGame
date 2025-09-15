import type { Plugin } from '../../core';
import { KinematicTween, Tween, TweenValue } from './components';
import { tweenParser } from './parser';
import { KinematicTweenSystem, TweenSystem } from './systems';

export const TweenPlugin: Plugin = {
  systems: [KinematicTweenSystem, TweenSystem],
  components: {
    Tween,
    TweenValue,
    KinematicTween,
  },
  config: {
    parsers: {
      tween: tweenParser,
    },
  },
};
