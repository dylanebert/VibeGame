import type { Adapter, Plugin } from '../../core';
import { Paragraph, Word } from './components';
import { paragraphRecipe, wordRecipe } from './recipes';
import {
  WordRenderSystem,
  WordMeasureSystem,
  ParagraphArrangeSystem,
} from './systems';
import { setTextContent } from './utils';

export const TextPlugin: Plugin = {
  recipes: [paragraphRecipe, wordRecipe],
  systems: [WordRenderSystem, WordMeasureSystem, ParagraphArrangeSystem],
  components: {
    Paragraph,
    Word,
  },
  config: {
    adapters: {
      word: {
        text: ((entity, value, state) =>
          setTextContent(state, entity, value)) as Adapter,
      },
    },
    defaults: {
      paragraph: {
        gap: 0.2,
        align: 1,
        anchorX: 1,
        anchorY: 1,
        damping: 0,
      },
      word: {
        fontSize: 1,
        color: 0xffffff,
        letterSpacing: 0,
        lineHeight: 1.2,
        outlineWidth: 0,
        outlineColor: 0x000000,
        outlineBlur: 0,
        outlineOffsetX: 0,
        outlineOffsetY: 0,
        outlineOpacity: 1,
        strokeWidth: 0,
        strokeColor: 0x000000,
        strokeOpacity: 1,
        fillOpacity: 1,
        curveRadius: 0,
        width: 0,
        dirty: 1,
      },
    },
    enums: {
      paragraph: {
        align: {
          left: 0,
          center: 1,
          right: 2,
        },
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
      },
    },
  },
};
