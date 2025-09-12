import type { State, System } from '../../core';
import { defineQuery, lerp } from '../../core';
import { Tween, TweenValue } from './components';
import {
  applyEasing,
  EasingNames,
  LoopMode,
  tweenFieldRegistry,
} from './utils';

const easingKeys = Object.values(EasingNames);

// Query definitions
const tweenQuery = defineQuery([Tween]);
const tweenValueQuery = defineQuery([TweenValue]);

export const TweenSystem: System = {
  group: 'simulation',

  update(state: State): void {
    const dt = state.time.deltaTime;
    const tweensToDestroy = new Set<number>();

    for (const tweenEntity of tweenQuery(state.world)) {
      Tween.elapsed[tweenEntity] += dt;

      const duration = Tween.duration[tweenEntity];
      const elapsed = Tween.elapsed[tweenEntity];
      const loopMode = Tween.loopMode[tweenEntity];

      let progress = elapsed / duration;

      if (loopMode === LoopMode.Once) {
        if (progress >= 1) {
          progress = 1;
          tweensToDestroy.add(tweenEntity);
        }
      } else if (loopMode === LoopMode.Loop) {
        progress = progress % 1;
      } else if (loopMode === LoopMode.PingPong) {
        const cycle = Math.floor(progress);
        progress = progress % 1;
        if (cycle % 2 === 1) {
          progress = 1 - progress;
        }
      }

      const easingIndex = Tween.easingIndex[tweenEntity];
      const easingKey = easingKeys[easingIndex] || 'linear';
      const t = applyEasing(progress, easingKey);

      for (const valueEntity of tweenValueQuery(state.world)) {
        if (TweenValue.source[valueEntity] !== tweenEntity) continue;

        const from = TweenValue.from[valueEntity];
        const to = TweenValue.to[valueEntity];
        const value = lerp(from, to, t);
        TweenValue.value[valueEntity] = value;

        const targetEntity = TweenValue.target[valueEntity];
        const array = tweenFieldRegistry.get(valueEntity);

        if (array && targetEntity < array.length) {
          array[targetEntity] = value;
        }
      }
    }

    for (const valueEntity of tweenValueQuery(state.world)) {
      const sourceEntity = TweenValue.source[valueEntity];
      if (tweensToDestroy.has(sourceEntity)) {
        tweenFieldRegistry.delete(valueEntity);
        state.destroyEntity(valueEntity);
      }
    }

    for (const tweenEntity of tweensToDestroy) {
      state.destroyEntity(tweenEntity);
    }
  },
};
