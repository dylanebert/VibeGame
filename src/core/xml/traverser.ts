import type { ParsedElement } from './types';

export type ElementHandler = (element: ParsedElement) => boolean | void;

export interface TraversalOptions {
  onElement?: ElementHandler;
  onUnhandled?: ElementHandler;
}

export function traverseElements(
  root: ParsedElement,
  options: TraversalOptions
): void {
  function traverse(element: ParsedElement): void {
    const handled = options.onElement?.(element);

    if (!handled && options.onUnhandled) {
      options.onUnhandled(element);
    }

    for (const child of element.children) {
      traverse(child);
    }
  }

  for (const child of root.children) {
    traverse(child);
  }
}

export function findElements(
  root: ParsedElement,
  predicate: (element: ParsedElement) => boolean
): ParsedElement[] {
  const results: ParsedElement[] = [];

  function traverse(element: ParsedElement): void {
    if (predicate(element)) {
      results.push(element);
    }
    for (const child of element.children) {
      traverse(child);
    }
  }

  for (const child of root.children) {
    traverse(child);
  }

  return results;
}
