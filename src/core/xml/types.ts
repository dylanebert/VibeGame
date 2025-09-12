export interface ParsedElement {
  tagName: string;
  attributes: Record<string, XMLValue>;
  children: ParsedElement[];
}

export interface XMLParseResult {
  root: ParsedElement;
}

export type XMLValue =
  | string
  | number
  | boolean
  | Record<string, number>
  | number[];
