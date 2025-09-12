import type { Plugin } from '../../core';
import { Tween, TweenValue } from './components';
import { tweenParser } from './parser';
import { TweenSystem } from './systems';

export const TweenPlugin: Plugin = {
  systems: [TweenSystem],
  components: {
    Tween,
    TweenValue,
  },
  config: {
    parsers: {
      tween: tweenParser,
    },
  },
};
