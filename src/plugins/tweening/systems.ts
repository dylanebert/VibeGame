import type { State, System } from '../../core';
import { defineQuery, lerp } from '../../core';
import { Body, BodyType, SetLinearVelocity } from '../physics';
import { KinematicTween, Tween, TweenValue } from './components';
import {
  applyEasing,
  EasingNames,
  LoopMode,
  tweenFieldRegistry,
} from './utils';

const easingKeys = Object.values(EasingNames);

const tweenQuery = defineQuery([Tween]);
const tweenValueQuery = defineQuery([TweenValue]);
const kinematicTweenQuery = defineQuery([KinematicTween]);

export const KinematicTweenSystem: System = {
  group: 'fixed',
  first: true,
  update(state: State): void {
    const dt = state.time.fixedDeltaTime;
    const tweensToDestroy = new Set<number>();

    for (const kinematicEntity of kinematicTweenQuery(state.world)) {
      const tweenEntity = KinematicTween.tweenEntity[kinematicEntity];
      const targetEntity = KinematicTween.targetEntity[kinematicEntity];

      if (
        !state.hasComponent(tweenEntity, Tween) ||
        !state.hasComponent(targetEntity, Body)
      ) {
        tweensToDestroy.add(kinematicEntity);
        continue;
      }

      const duration = Tween.duration[tweenEntity];
      const elapsed = Tween.elapsed[tweenEntity];
      const loopMode = Tween.loopMode[tweenEntity];

      let progress = elapsed / duration;

      if (loopMode === LoopMode.Once) {
        if (progress >= 1) {
          progress = 1;
          tweensToDestroy.add(kinematicEntity);
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

      const from = KinematicTween.from[kinematicEntity];
      const to = KinematicTween.to[kinematicEntity];
      const currentTargetPosition = lerp(from, to, t);

      const nextElapsed = Math.min(
        Tween.elapsed[tweenEntity] + dt,
        loopMode === LoopMode.Once
          ? Tween.duration[tweenEntity]
          : Tween.elapsed[tweenEntity] + dt
      );
      let nextProgress = nextElapsed / Tween.duration[tweenEntity];
      if (loopMode === LoopMode.Loop) {
        nextProgress = nextProgress % 1;
      } else if (loopMode === LoopMode.PingPong) {
        const nextCycle = Math.floor(nextProgress);
        nextProgress = nextProgress % 1;
        if (nextCycle % 2 === 1) {
          nextProgress = 1 - nextProgress;
        }
      } else if (loopMode === LoopMode.Once && nextProgress > 1) {
        nextProgress = 1;
      }

      const nextT = applyEasing(nextProgress, easingKey);
      const nextTargetPosition = lerp(from, to, nextT);

      const velocity = (nextTargetPosition - currentTargetPosition) / dt;
      KinematicTween.targetPosition[kinematicEntity] = currentTargetPosition;

      const axis = KinematicTween.axis[kinematicEntity];

      if (axis === 0) {
        Body.posX[targetEntity] = currentTargetPosition;
      } else if (axis === 1) {
        Body.posY[targetEntity] = currentTargetPosition;
      } else {
        Body.posZ[targetEntity] = currentTargetPosition;
      }

      if (!state.hasComponent(targetEntity, SetLinearVelocity)) {
        state.addComponent(targetEntity, SetLinearVelocity);
        SetLinearVelocity.x[targetEntity] = Body.velX[targetEntity] || 0;
        SetLinearVelocity.y[targetEntity] = Body.velY[targetEntity] || 0;
        SetLinearVelocity.z[targetEntity] = Body.velZ[targetEntity] || 0;
      }

      const currentVelX = SetLinearVelocity.x[targetEntity];
      const currentVelY = SetLinearVelocity.y[targetEntity];
      const currentVelZ = SetLinearVelocity.z[targetEntity];

      SetLinearVelocity.x[targetEntity] = axis === 0 ? velocity : currentVelX;
      SetLinearVelocity.y[targetEntity] = axis === 1 ? velocity : currentVelY;
      SetLinearVelocity.z[targetEntity] = axis === 2 ? velocity : currentVelZ;

      KinematicTween.lastPosition[kinematicEntity] = currentTargetPosition;
    }

    for (const kinematicEntity of tweensToDestroy) {
      state.destroyEntity(kinematicEntity);
    }
  },
};

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

        const targetEntity = TweenValue.target[valueEntity];
        const array = tweenFieldRegistry.get(valueEntity);

        const isKinematicVelocityBody =
          state.hasComponent(targetEntity, Body) &&
          Body.type[targetEntity] === BodyType.KinematicVelocityBased &&
          array &&
          (array === Body.posX || array === Body.posY || array === Body.posZ);

        if (isKinematicVelocityBody) {
          continue;
        }

        const from = TweenValue.from[valueEntity];
        const to = TweenValue.to[valueEntity];
        const value = lerp(from, to, t);
        TweenValue.value[valueEntity] = value;

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
