import type { Parser } from '../../core';
import { setTextContent } from './utils';

export const textParser: Parser = ({ entity, element, state }) => {
  const textAttr = element.attributes.text;
  if (typeof textAttr !== 'string') return;

  const textMatch = textAttr.match(/text:\s*([^;]+)/);
  if (textMatch) {
    setTextContent(state, entity, textMatch[1].trim());
  }
};
