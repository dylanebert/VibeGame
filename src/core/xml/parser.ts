import type { ParsedElement, XMLParseResult, XMLValue } from './types';
import { XMLValueParser } from './values';

export const XMLParser = {
  parse(xmlString: string): XMLParseResult {
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(xmlString, 'text/xml');

    if (doc.documentElement.tagName === 'parsererror') {
      throw new Error('Invalid XML syntax');
    }

    const root = parseElement(doc.documentElement);
    return { root };
  },
};

function parseElement(element: Element): ParsedElement {
  const attributes: Record<string, XMLValue> = {};

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = XMLValueParser.parse(attr.value);
  }

  const children: ParsedElement[] = [];
  for (let i = 0; i < element.children.length; i++) {
    children.push(parseElement(element.children[i]));
  }

  return {
    tagName: element.tagName.toLowerCase(),
    attributes,
    children,
  };
}
