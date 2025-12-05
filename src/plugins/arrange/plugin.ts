import type { Plugin } from '../../core';
import { Group, Member } from './components';
import { arrangeParser } from './parser';
import { ArrangeSystem } from './systems';
import { StrategyNames } from './utils';

export const ArrangePlugin: Plugin = {
  components: {
    group: Group,
    member: Member,
  },
  systems: [ArrangeSystem],
  recipes: [{ name: 'arrange', components: [] }],
  config: {
    parsers: {
      arrange: arrangeParser,
    },
    defaults: {
      group: {
        weight: 1,
        gap: 1,
      },
    },
    enums: {
      group: {
        strategy: StrategyNames,
      },
    },
  },
};
