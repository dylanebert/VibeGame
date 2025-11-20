import type { Parser, XMLValue } from '../../core';
import { formatEnumError } from '../../core/recipes/diagnostics';
import { Sequence, SequenceState } from './components';
import {
  createTween,
  EasingNames,
  sequenceRegistry,
  type SequenceItemSpec,
  type TweenOptions,
} from './utils';

const VALID_EASINGS = Object.keys(EasingNames);

function validateEasing(easing: string | undefined, context: string): void {
  if (!easing) return;

  if (!VALID_EASINGS.includes(easing)) {
    throw new Error(formatEnumError(context, 'easing', easing, VALID_EASINGS));
  }
}

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

export const tweenParser: Parser = ({ element, state, context }) => {
  if (element.tagName !== 'tween') {
    return;
  }

  const targetName = element.attributes.target as string;
  if (!targetName) {
    throw new Error(
      '[Tween] Missing required attribute "target".\n' +
        '  Tweens must specify which entity to animate using the target attribute.\n' +
        '  Example: <tween target="my-cube" attr="transform.pos-x" to="10"></tween>'
    );
  }

  const targetEntity = context.getEntityByName(targetName);
  if (targetEntity === null) {
    throw new Error(
      `[Tween] Could not find entity with name "${targetName}".\n` +
        '  Make sure the target entity has a name attribute that matches.\n' +
        '  Example: <entity name="my-cube" transform=""></entity>'
    );
  }

  const attr = element.attributes.attr as string;
  if (!attr) {
    throw new Error(
      '[Tween] Missing required attribute "attr".\n' +
        '  Tweens must specify which property to animate.\n' +
        '  Example: <tween target="my-cube" attr="transform.pos-x" to="10"></tween>'
    );
  }

  const to = element.attributes.to;
  if (to === undefined || to === null) {
    throw new Error(
      '[Tween] Missing required attribute "to".\n' +
        '  Tweens must specify the target value.\n' +
        '  Example: <tween target="my-cube" attr="transform.pos-x" to="10"></tween>'
    );
  }

  const easing = element.attributes.easing as string | undefined;
  validateEasing(easing, 'tween');

  const options: TweenOptions = {
    from:
      element.attributes.from !== undefined
        ? toNumberOrArray(element.attributes.from)
        : undefined,
    to: toNumberOrArray(to),
    duration: toNumber(element.attributes.duration || 1),
    easing,
  };

  const tweenEntity = createTween(state, targetEntity, attr, options);
  if (!tweenEntity) {
    throw new Error(`[Tween] Could not resolve tween target property: ${attr}`);
  }
};

export const sequenceParser: Parser = ({ element, state, context }) => {
  if (element.tagName !== 'sequence') return;

  const seqEntity = state.createEntity();
  state.addComponent(seqEntity, Sequence);

  const name = element.attributes.name as string | undefined;
  const autoplay = element.attributes.autoplay as boolean | undefined;

  if (name) {
    context.setName(name, seqEntity);
  }

  const items: SequenceItemSpec[] = [];

  for (const child of element.children) {
    if (child.tagName === 'tween') {
      const targetName = child.attributes.target as string;
      if (!targetName) {
        throw new Error('[Sequence] Tween missing "target" attribute');
      }

      const targetEntity = context.getEntityByName(targetName);
      if (targetEntity === null) {
        throw new Error(`[Sequence] Target "${targetName}" not found`);
      }

      const attr = child.attributes.attr as string;
      if (!attr) {
        throw new Error('[Sequence] Tween missing "attr" attribute');
      }

      const to = child.attributes.to;
      if (to === undefined || to === null) {
        throw new Error('[Sequence] Tween missing "to" attribute');
      }

      const easing = child.attributes.easing as string | undefined;
      validateEasing(easing, 'sequence > tween');

      items.push({
        type: 'tween',
        target: targetEntity,
        attr,
        from:
          child.attributes.from !== undefined
            ? toNumberOrArray(child.attributes.from)
            : undefined,
        to: toNumberOrArray(to),
        duration: toNumber(child.attributes.duration || 1),
        easing,
      });
    } else if (child.tagName === 'pause') {
      items.push({
        type: 'pause',
        duration: toNumber(child.attributes.duration || 0),
      });
    }
  }

  sequenceRegistry.set(seqEntity, items);

  Sequence.state[seqEntity] = autoplay
    ? SequenceState.Playing
    : SequenceState.Idle;
  Sequence.currentIndex[seqEntity] = 0;
  Sequence.itemCount[seqEntity] = items.length;
  Sequence.pauseRemaining[seqEntity] = 0;
};
