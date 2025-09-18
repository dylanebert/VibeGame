import type { Plugin } from '../../core';
import {
  KinematicRotationTween,
  KinematicTween,
  Tween,
  TweenValue,
} from './components';
import { tweenParser } from './parser';
import {
  KinematicRotationTweenSystem,
  KinematicTweenSystem,
  TweenSystem,
} from './systems';

export const TweenPlugin: Plugin = {
  systems: [KinematicTweenSystem, KinematicRotationTweenSystem, TweenSystem],
  components: {
    Tween,
    TweenValue,
    KinematicTween,
    KinematicRotationTween,
  },
  config: {
    parsers: {
      tween: tweenParser,
    },
  },
};
