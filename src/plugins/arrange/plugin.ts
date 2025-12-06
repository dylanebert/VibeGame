import type { Plugin } from '../../core';
import {
  Align,
  GridGroup,
  GridMember,
  HorizontalGroup,
  HorizontalMember,
  VerticalGroup,
  VerticalMember,
} from './components';
import {
  GridArrangeSystem,
  HorizontalArrangeSystem,
  VerticalArrangeSystem,
} from './systems';
import { AlignNames } from './utils';

export const ArrangePlugin: Plugin = {
  components: {
    'horizontal-group': HorizontalGroup,
    'horizontal-member': HorizontalMember,
    'vertical-group': VerticalGroup,
    'vertical-member': VerticalMember,
    'grid-group': GridGroup,
    'grid-member': GridMember,
  },
  systems: [HorizontalArrangeSystem, VerticalArrangeSystem, GridArrangeSystem],
  config: {
    defaults: {
      'horizontal-group': {
        gap: 1,
        align: Align.Center,
        blend: 1,
        speed: 30,
      },
      'vertical-group': {
        gap: 1,
        align: Align.Center,
        blend: 1,
        speed: 30,
      },
      'grid-group': {
        gapX: 1,
        gapY: 1,
        columns: 3,
        alignX: Align.Center,
        alignY: Align.Center,
        blend: 1,
        speed: 30,
      },
    },
    enums: {
      'horizontal-group': {
        align: AlignNames,
      },
      'vertical-group': {
        align: AlignNames,
      },
      'grid-group': {
        alignX: AlignNames,
        alignY: AlignNames,
      },
    },
  },
};
