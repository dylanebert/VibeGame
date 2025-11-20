import type { Plugin } from '../../core';
import {
  KinematicRotationTween,
  KinematicTween,
  Sequence,
  Tween,
  TweenValue,
} from './components';
import { sequenceParser, tweenParser } from './parser';
import {
  KinematicRotationTweenSystem,
  KinematicTweenSystem,
  SequenceSystem,
  TweenSystem,
} from './systems';

export const TweenPlugin: Plugin = {
  systems: [
    KinematicTweenSystem,
    KinematicRotationTweenSystem,
    TweenSystem,
    SequenceSystem,
  ],
  components: {
    Tween,
    TweenValue,
    KinematicTween,
    KinematicRotationTween,
    Sequence,
  },
  recipes: [
    { name: 'tween', components: [] },
    { name: 'sequence', components: [] },
  ],
  config: {
    parsers: {
      tween: tweenParser,
      sequence: sequenceParser,
    },
  },
};
