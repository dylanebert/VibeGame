import type { Plugin } from '../../core';
import { Align, HorizontalGroup, HorizontalMember } from './components';
import { HorizontalArrangeSystem } from './systems';
import { AlignNames } from './utils';

export const ArrangePlugin: Plugin = {
  components: {
    'horizontal-group': HorizontalGroup,
    'horizontal-member': HorizontalMember,
  },
  systems: [HorizontalArrangeSystem],
  config: {
    defaults: {
      'horizontal-group': {
        gap: 1,
        align: Align.Center,
        blend: 1,
      },
    },
    enums: {
      'horizontal-group': {
        align: AlignNames,
      },
    },
  },
};
