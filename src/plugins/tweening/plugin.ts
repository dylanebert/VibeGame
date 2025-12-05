import type { Plugin } from '../../core';
import {
  KinematicRotationTween,
  KinematicTween,
  Sequence,
  Shaker,
  Tween,
  TweenValue,
} from './components';
import { sequenceParser, shakerParser, tweenParser } from './parser';
import {
  KinematicRotationTweenSystem,
  KinematicTweenSystem,
  SequenceSystem,
  ShakerApplySystem,
  ShakerCleanupSystem,
  ShakerRestoreSystem,
  TweenSystem,
} from './systems';

export const TweenPlugin: Plugin = {
  systems: [
    KinematicTweenSystem,
    KinematicRotationTweenSystem,
    TweenSystem,
    SequenceSystem,
    ShakerApplySystem,
    ShakerRestoreSystem,
    ShakerCleanupSystem,
  ],
  components: {
    Tween,
    TweenValue,
    KinematicTween,
    KinematicRotationTween,
    Sequence,
    Shaker,
  },
  recipes: [
    { name: 'tween', components: [] },
    { name: 'sequence', components: [] },
    { name: 'shaker', components: [] },
  ],
  config: {
    parsers: {
      tween: tweenParser,
      sequence: sequenceParser,
      shaker: shakerParser,
    },
  },
};
