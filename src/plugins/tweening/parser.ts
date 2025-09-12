import type { ParsedElement, Parser, State, XMLValue } from '../../core';
import { createTween, type TweenOptions } from './utils';

function toNumber(value: XMLValue): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return 0;
}

function toNumberOrArray(value: XMLValue): number | number[] {
  if (typeof value === 'number') return value;

  if (typeof value === 'object' && value !== null) {
    const vec = value as Record<string, number>;
    if ('x' in vec || 'y' in vec || 'z' in vec) {
      return [vec.x || 0, vec.y || 0, vec.z || 0];
    }
  }

  return toNumber(value);
}

export const tweenParser: Parser = (
  parentEntity: number,
  element: ParsedElement,
  state: State
): number | null => {
  if (element.tagName !== 'tween') {
    return null;
  }

  const targetStr = element.attributes.target as string;
  if (!targetStr) {
    console.warn('Tween element missing target attribute');
    return null;
  }

  const to = element.attributes.to;
  if (to === undefined || to === null) {
    console.warn('Tween element missing "to" attribute');
    return null;
  }

  const options: TweenOptions = {
    from:
      element.attributes.from !== undefined
        ? toNumberOrArray(element.attributes.from)
        : undefined,
    to: toNumberOrArray(to),
    duration: toNumber(element.attributes.duration || 1),
    easing: element.attributes.easing as string,
    loop: element.attributes.loop as string,
  };

  const tweenEntity = createTween(state, parentEntity, targetStr, options);
  if (!tweenEntity) {
    console.warn(`Could not resolve tween target: ${targetStr}`);
  }

  return tweenEntity;
};
