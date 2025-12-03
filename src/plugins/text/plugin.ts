import type { Plugin } from '../../core';
import { Text } from './components';
import { textParser } from './parser';
import { TextSystem } from './systems';

export const TextPlugin: Plugin = {
  systems: [TextSystem],
  components: {
    Text,
  },
  config: {
    parsers: {
      entity: textParser,
    },
    defaults: {
      text: {
        fontSize: 1,
        color: 0xffffff,
        anchorX: 1,
        anchorY: 1,
        textAlign: 0,
        maxWidth: 0,
        lineHeight: 1.2,
        dirty: 1,
      },
    },
    enums: {
      text: {
        anchorX: {
          left: 0,
          center: 1,
          right: 2,
        },
        anchorY: {
          top: 0,
          middle: 1,
          bottom: 2,
        },
        textAlign: {
          left: 0,
          center: 1,
          right: 2,
          justify: 3,
        },
      },
    },
    skip: {
      text: ['text'],
    },
  },
};
