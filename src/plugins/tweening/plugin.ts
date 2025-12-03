import type { Plugin } from '../../core';
import {
  KinematicRotationTween,
  KinematicTween,
  Sequence,
  Shaker,
  TransformShaker,
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
  TransformShakerApplySystem,
  TransformShakerCleanupSystem,
  TransformShakerRestoreSystem,
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
    TransformShakerApplySystem,
    TransformShakerRestoreSystem,
    TransformShakerCleanupSystem,
  ],
  components: {
    Tween,
    TweenValue,
    KinematicTween,
    KinematicRotationTween,
    Sequence,
    Shaker,
    TransformShaker,
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
