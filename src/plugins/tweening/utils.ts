import type { Component } from 'bitecs';
import { gsap } from 'gsap';
import type { State } from '../../core';
import { toCamelCase } from '../../core';
import { Tween, TweenValue } from './components';

export enum LoopMode {
  Once = 0,
  Loop = 1,
  PingPong = 2,
}

export const LoopModeNames: Record<string, LoopMode> = {
  once: LoopMode.Once,
  loop: LoopMode.Loop,
  'ping-pong': LoopMode.PingPong,
};

export const EasingNames: Record<string, string> = {
  linear: 'linear',
  'sine-in': 'sineIn',
  'sine-out': 'sineOut',
  'sine-in-out': 'sineInOut',
  'quad-in': 'quadIn',
  'quad-out': 'quadOut',
  'quad-in-out': 'quadInOut',
  'cubic-in': 'cubicIn',
  'cubic-out': 'cubicOut',
  'cubic-in-out': 'cubicInOut',
  'quart-in': 'quartIn',
  'quart-out': 'quartOut',
  'quart-in-out': 'quartInOut',
  'expo-in': 'expoIn',
  'expo-out': 'expoOut',
  'expo-in-out': 'expoInOut',
  'circ-in': 'circIn',
  'circ-out': 'circOut',
  'circ-in-out': 'circInOut',
  'back-in': 'backIn',
  'back-out': 'backOut',
  'back-in-out': 'backInOut',
  'elastic-in': 'elasticIn',
  'elastic-out': 'elasticOut',
  'elastic-in-out': 'elasticInOut',
  'bounce-in': 'bounceIn',
  'bounce-out': 'bounceOut',
  'bounce-in-out': 'bounceInOut',
};

const easingFunctions = {
  linear: (t: number) => t,
  sineIn: (t: number) => gsap.parseEase('power1.in')(t),
  sineOut: (t: number) => gsap.parseEase('power1.out')(t),
  sineInOut: (t: number) => gsap.parseEase('power1.inOut')(t),
  quadIn: (t: number) => gsap.parseEase('power2.in')(t),
  quadOut: (t: number) => gsap.parseEase('power2.out')(t),
  quadInOut: (t: number) => gsap.parseEase('power2.inOut')(t),
  cubicIn: (t: number) => gsap.parseEase('power3.in')(t),
  cubicOut: (t: number) => gsap.parseEase('power3.out')(t),
  cubicInOut: (t: number) => gsap.parseEase('power3.inOut')(t),
  quartIn: (t: number) => gsap.parseEase('power4.in')(t),
  quartOut: (t: number) => gsap.parseEase('power4.out')(t),
  quartInOut: (t: number) => gsap.parseEase('power4.inOut')(t),
  expoIn: (t: number) => gsap.parseEase('expo.in')(t),
  expoOut: (t: number) => gsap.parseEase('expo.out')(t),
  expoInOut: (t: number) => gsap.parseEase('expo.inOut')(t),
  circIn: (t: number) => gsap.parseEase('circ.in')(t),
  circOut: (t: number) => gsap.parseEase('circ.out')(t),
  circInOut: (t: number) => gsap.parseEase('circ.inOut')(t),
  backIn: (t: number) => gsap.parseEase('back.in')(t),
  backOut: (t: number) => gsap.parseEase('back.out')(t),
  backInOut: (t: number) => gsap.parseEase('back.inOut')(t),
  elasticIn: (t: number) => gsap.parseEase('elastic.in')(t),
  elasticOut: (t: number) => gsap.parseEase('elastic.out')(t),
  elasticInOut: (t: number) => gsap.parseEase('elastic.inOut')(t),
  bounceIn: (t: number) => gsap.parseEase('bounce.in')(t),
  bounceOut: (t: number) => gsap.parseEase('bounce.out')(t),
  bounceInOut: (t: number) => gsap.parseEase('bounce.inOut')(t),
};

export function applyEasing(t: number, easingKey: string): number {
  const easingFn =
    easingFunctions[easingKey as keyof typeof easingFunctions] ||
    easingFunctions.linear;
  return easingFn(t);
}

export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function resolveComponentField(
  targetStr: string,
  entity: number,
  state: State
): { component: Component; field: string; array: Float32Array } | null {
  const [componentName, fieldName] = targetStr.split('.');
  if (!componentName || !fieldName) return null;

  const component = state.getComponent(componentName);
  if (!component || !state.hasComponent(entity, component)) return null;

  const camelField = toCamelCase(fieldName);
  const array = (component as Record<string, Float32Array>)[camelField];
  if (!(array instanceof Float32Array)) return null;

  return { component, field: camelField, array };
}

function parseNumberOrArray(
  value: number | number[] | undefined,
  defaultValue: number | number[]
): number[] {
  if (value === undefined) {
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  }
  return Array.isArray(value) ? value : [value];
}

export function expandShorthand(
  target: string,
  options: { from?: number | number[]; to: number | number[] }
): Array<{ field: string; from: number; to: number }> {
  const results: Array<{ field: string; from: number; to: number }> = [];

  if (target === 'rotation') {
    const toArray = parseNumberOrArray(options.to, [0, 0, 0]);
    const fromArray = parseNumberOrArray(options.from, [0, 0, 0]);
    const fields = ['eulerX', 'eulerY', 'eulerZ'];

    for (let i = 0; i < fields.length; i++) {
      results.push({
        field: `transform.${fields[i]}`,
        from: fromArray[i] || 0,
        to: toArray[i] || 0,
      });
    }
  } else if (target === 'at') {
    const toArray = parseNumberOrArray(options.to, [0, 0, 0]);
    const fromArray = parseNumberOrArray(options.from, [0, 0, 0]);
    const fields = ['posX', 'posY', 'posZ'];

    for (let i = 0; i < fields.length; i++) {
      results.push({
        field: `transform.${fields[i]}`,
        from: fromArray[i] || 0,
        to: toArray[i] || 0,
      });
    }
  } else if (target === 'scale') {
    const toArray = parseNumberOrArray(options.to, [1, 1, 1]);
    const fromArray = parseNumberOrArray(options.from, [1, 1, 1]);
    const fields = ['scaleX', 'scaleY', 'scaleZ'];

    for (let i = 0; i < fields.length; i++) {
      results.push({
        field: `transform.${fields[i]}`,
        from: fromArray[i] || 1,
        to: toArray[i] || 1,
      });
    }
  }

  return results;
}

export interface TweenOptions {
  from?: number | number[];
  to: number | number[];
  duration?: number;
  easing?: string;
  loop?: string | number;
}

const easingKeys = Object.values(EasingNames);
const easingIndexMap = new Map<string, number>();
easingKeys.forEach((key, index) => easingIndexMap.set(key, index));

export const tweenFieldRegistry = new Map<number, Float32Array>();

export function createTween(
  state: State,
  entity: number,
  target: string,
  options: TweenOptions
): number | null {
  const tweenEntity = state.createEntity();
  state.addComponent(tweenEntity, Tween);

  Tween.duration[tweenEntity] = options.duration ?? 1;
  Tween.elapsed[tweenEntity] = 0;

  const easingKey = options.easing
    ? EasingNames[options.easing] || options.easing
    : 'linear';
  Tween.easingIndex[tweenEntity] = easingIndexMap.get(easingKey) ?? 0;

  if (typeof options.loop === 'string') {
    Tween.loopMode[tweenEntity] = LoopModeNames[options.loop] ?? LoopMode.Once;
  } else {
    Tween.loopMode[tweenEntity] = options.loop ?? LoopMode.Once;
  }

  const shorthandFields = expandShorthand(target, options);
  if (shorthandFields.length > 0) {
    for (const fieldData of shorthandFields) {
      const resolved = resolveComponentField(fieldData.field, entity, state);
      if (!resolved) continue;

      const valueEntity = state.createEntity();
      state.addComponent(valueEntity, TweenValue);

      TweenValue.source[valueEntity] = tweenEntity;
      TweenValue.target[valueEntity] = entity;
      TweenValue.componentId[valueEntity] = 0;
      TweenValue.fieldIndex[valueEntity] = 0;
      TweenValue.from[valueEntity] = fieldData.from;
      TweenValue.to[valueEntity] = fieldData.to;
      TweenValue.value[valueEntity] = fieldData.from;

      tweenFieldRegistry.set(valueEntity, resolved.array);
    }
  } else {
    const resolved = resolveComponentField(target, entity, state);
    if (!resolved) return null;

    const currentValue = resolved.array[entity];
    const fromValue =
      typeof options.from === 'number'
        ? options.from
        : (options.from?.[0] ?? currentValue);
    const toValue = typeof options.to === 'number' ? options.to : options.to[0];

    const valueEntity = state.createEntity();
    state.addComponent(valueEntity, TweenValue);

    TweenValue.source[valueEntity] = tweenEntity;
    TweenValue.target[valueEntity] = entity;
    TweenValue.componentId[valueEntity] = 0;
    TweenValue.fieldIndex[valueEntity] = 0;
    TweenValue.from[valueEntity] = fromValue;
    TweenValue.to[valueEntity] = toValue;
    TweenValue.value[valueEntity] = fromValue;

    tweenFieldRegistry.set(valueEntity, resolved.array);
  }

  return tweenEntity;
}
