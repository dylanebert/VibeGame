import type { State, System } from '../../core';
import { defineQuery, lerp } from '../../core';
import {
  Body,
  BodyType,
  SetAngularVelocity,
  SetLinearVelocity,
} from '../physics';
import {
  KinematicRotationTween,
  KinematicTween,
  Sequence,
  SequenceState,
  Shaker,
  ShakerMode,
  TransformShaker,
  TransformShakerAxes,
  TransformShakerType,
  Tween,
  TweenValue,
} from './components';
import * as THREE from 'three';
import { WorldTransform } from '../transforms';
import {
  applyEasing,
  createTween,
  EasingNames,
  sequenceActiveTweens,
  sequenceRegistry,
  shakerBaseRegistry,
  shakerFieldRegistry,
  transformShakerBaseRegistry,
  transformShakerQuatRegistry,
  tweenFieldRegistry,
} from './utils';

const tempQuat = new THREE.Quaternion();
const tempEuler = new THREE.Euler();
const DEG_TO_RAD = Math.PI / 180;

const easingKeys = Object.values(EasingNames);

const tweenQuery = defineQuery([Tween]);
const tweenValueQuery = defineQuery([TweenValue]);
const kinematicTweenQuery = defineQuery([KinematicTween]);
const kinematicRotationTweenQuery = defineQuery([KinematicRotationTween]);
const sequenceQuery = defineQuery([Sequence]);
const shakerQuery = defineQuery([Shaker]);
const transformShakerQuery = defineQuery([TransformShaker]);

const RAD_TO_DEG = 180 / Math.PI;

type Vec3Arrays = { x: Float32Array; y: Float32Array; z: Float32Array };

const bodyPos: Vec3Arrays = { x: Body.posX, y: Body.posY, z: Body.posZ };
const bodyEuler: Vec3Arrays = {
  x: Body.eulerX,
  y: Body.eulerY,
  z: Body.eulerZ,
};
const bodyVel: Vec3Arrays = { x: Body.velX, y: Body.velY, z: Body.velZ };
const bodyRotVel: Vec3Arrays = {
  x: Body.rotVelX,
  y: Body.rotVelY,
  z: Body.rotVelZ,
};

function getAxisArray(vec: Vec3Arrays, axis: number): Float32Array {
  return axis === 0 ? vec.x : axis === 1 ? vec.y : vec.z;
}

function ensureVelocityComponent(
  state: State,
  entity: number,
  component: typeof SetLinearVelocity | typeof SetAngularVelocity,
  source: Vec3Arrays
): void {
  if (!state.hasComponent(entity, component)) {
    state.addComponent(entity, component);
    component.x[entity] = source.x[entity];
    component.y[entity] = source.y[entity];
    component.z[entity] = source.z[entity];
  }
}

function computeTweenState(
  state: State,
  tweenEntity: number,
  from: number,
  to: number,
  dt: number
): { position: number; velocity: number; done: boolean } {
  if (!state.hasComponent(tweenEntity, Tween)) {
    return { position: to, velocity: 0, done: true };
  }

  const duration = Tween.duration[tweenEntity];
  const elapsed = Tween.elapsed[tweenEntity];
  const progress = elapsed / duration;

  if (progress >= 1) {
    return { position: to, velocity: 0, done: true };
  }

  const easingKey = easingKeys[Tween.easingIndex[tweenEntity]] || 'linear';
  const t = applyEasing(progress, easingKey);
  const position = lerp(from, to, t);

  const nextT = applyEasing(Math.min((elapsed + dt) / duration, 1), easingKey);
  const nextPosition = lerp(from, to, nextT);
  const velocity = (nextPosition - position) / dt;

  return { position, velocity, done: false };
}

function wrapAngleDelta(delta: number): number {
  if (delta > Math.PI) return delta - 2 * Math.PI;
  if (delta < -Math.PI) return delta + 2 * Math.PI;
  return delta;
}

function computeRotationTweenState(
  state: State,
  tweenEntity: number,
  from: number,
  to: number,
  dt: number
): { rotation: number; angularVelocity: number; done: boolean } {
  if (!state.hasComponent(tweenEntity, Tween)) {
    return { rotation: to, angularVelocity: 0, done: true };
  }

  const duration = Tween.duration[tweenEntity];
  const elapsed = Tween.elapsed[tweenEntity];
  const progress = elapsed / duration;

  if (progress >= 1) {
    return { rotation: to, angularVelocity: 0, done: true };
  }

  const easingKey = easingKeys[Tween.easingIndex[tweenEntity]] || 'linear';
  const t = applyEasing(progress, easingKey);
  const rotation = lerp(from, to, t);

  const nextT = applyEasing(Math.min((elapsed + dt) / duration, 1), easingKey);
  const nextRotation = lerp(from, to, nextT);
  const angularVelocity = wrapAngleDelta(nextRotation - rotation) / dt;

  return { rotation, angularVelocity, done: false };
}

export const KinematicTweenSystem: System = {
  group: 'fixed',
  first: true,
  update(state: State): void {
    const dt = state.time.fixedDeltaTime;
    const toDestroy: number[] = [];

    for (const entity of kinematicTweenQuery(state.world)) {
      const targetEntity = KinematicTween.targetEntity[entity];

      if (!state.hasComponent(targetEntity, Body)) {
        toDestroy.push(entity);
        continue;
      }

      const axis = KinematicTween.axis[entity];
      const { position, velocity, done } = computeTweenState(
        state,
        KinematicTween.tweenEntity[entity],
        KinematicTween.from[entity],
        KinematicTween.to[entity],
        dt
      );

      getAxisArray(bodyPos, axis)[targetEntity] = position;

      ensureVelocityComponent(state, targetEntity, SetLinearVelocity, bodyVel);
      getAxisArray(SetLinearVelocity, axis)[targetEntity] = velocity;

      KinematicTween.lastPosition[entity] = position;
      KinematicTween.targetPosition[entity] = position;

      if (done) toDestroy.push(entity);
    }

    for (const entity of toDestroy) state.destroyEntity(entity);
  },
};

export const KinematicRotationTweenSystem: System = {
  group: 'fixed',
  after: [KinematicTweenSystem],
  update(state: State): void {
    const dt = state.time.fixedDeltaTime;
    const toDestroy: number[] = [];

    for (const entity of kinematicRotationTweenQuery(state.world)) {
      const targetEntity = KinematicRotationTween.targetEntity[entity];

      if (!state.hasComponent(targetEntity, Body)) {
        toDestroy.push(entity);
        continue;
      }

      const axis = KinematicRotationTween.axis[entity];
      const { rotation, angularVelocity, done } = computeRotationTweenState(
        state,
        KinematicRotationTween.tweenEntity[entity],
        KinematicRotationTween.from[entity],
        KinematicRotationTween.to[entity],
        dt
      );

      getAxisArray(bodyEuler, axis)[targetEntity] = rotation * RAD_TO_DEG;

      ensureVelocityComponent(
        state,
        targetEntity,
        SetAngularVelocity,
        bodyRotVel
      );
      getAxisArray(SetAngularVelocity, axis)[targetEntity] = angularVelocity;

      KinematicRotationTween.lastRotation[entity] = rotation;
      KinematicRotationTween.targetRotation[entity] = rotation;

      if (done) toDestroy.push(entity);
    }

    for (const entity of toDestroy) state.destroyEntity(entity);
  },
};

export const TweenSystem: System = {
  group: 'simulation',
  update(state: State): void {
    const dt = state.time.deltaTime;
    const completedTweens = new Set<number>();

    for (const tweenEntity of tweenQuery(state.world)) {
      Tween.elapsed[tweenEntity] += dt;

      const progress = Tween.elapsed[tweenEntity] / Tween.duration[tweenEntity];
      if (progress >= 1) completedTweens.add(tweenEntity);

      const easingKey = easingKeys[Tween.easingIndex[tweenEntity]] || 'linear';
      const t = applyEasing(Math.min(progress, 1), easingKey);

      for (const valueEntity of tweenValueQuery(state.world)) {
        if (TweenValue.source[valueEntity] !== tweenEntity) continue;

        const targetEntity = TweenValue.target[valueEntity];
        const array = tweenFieldRegistry.get(valueEntity);

        const isKinematicBodyField =
          state.hasComponent(targetEntity, Body) &&
          Body.type[targetEntity] === BodyType.KinematicVelocityBased &&
          array &&
          (array === Body.posX ||
            array === Body.posY ||
            array === Body.posZ ||
            array === Body.eulerX ||
            array === Body.eulerY ||
            array === Body.eulerZ);

        if (isKinematicBodyField) continue;

        const value = lerp(
          TweenValue.from[valueEntity],
          TweenValue.to[valueEntity],
          t
        );
        TweenValue.value[valueEntity] = value;

        if (array && targetEntity < array.length) {
          array[targetEntity] = value;
        }
      }
    }

    for (const valueEntity of tweenValueQuery(state.world)) {
      if (completedTweens.has(TweenValue.source[valueEntity])) {
        tweenFieldRegistry.delete(valueEntity);
        state.destroyEntity(valueEntity);
      }
    }

    for (const tweenEntity of completedTweens) {
      state.destroyEntity(tweenEntity);
    }
  },
};

function activateSequenceItems(state: State, seqEntity: number): void {
  const items = sequenceRegistry.get(seqEntity);
  if (!items) return;

  let index = Sequence.currentIndex[seqEntity];
  if (index >= items.length) return;

  let activeTweens = sequenceActiveTweens.get(seqEntity);
  if (!activeTweens) {
    activeTweens = new Set();
    sequenceActiveTweens.set(seqEntity, activeTweens);
  }

  while (index < items.length) {
    const item = items[index];

    if (item.type === 'pause') {
      Sequence.pauseRemaining[seqEntity] = item.duration;
      Sequence.currentIndex[seqEntity] = index;
      return;
    }

    if (item.target !== undefined && item.attr) {
      const tweenEntity = createTween(state, item.target, item.attr, {
        from: item.from,
        to: item.to ?? 0,
        duration: item.duration,
        easing: item.easing,
      });
      if (tweenEntity) {
        activeTweens.add(tweenEntity);
      }
    }

    index++;
  }

  Sequence.currentIndex[seqEntity] = index;
}

export const SequenceSystem: System = {
  group: 'simulation',
  after: [TweenSystem],
  update(state: State): void {
    const dt = state.time.deltaTime;

    for (const seqEntity of sequenceQuery(state.world)) {
      if (Sequence.state[seqEntity] !== SequenceState.Playing) continue;

      const pauseRemaining = Sequence.pauseRemaining[seqEntity];

      if (pauseRemaining > 0) {
        Sequence.pauseRemaining[seqEntity] = pauseRemaining - dt;
        if (Sequence.pauseRemaining[seqEntity] <= 0) {
          Sequence.currentIndex[seqEntity]++;
          activateSequenceItems(state, seqEntity);
        }
        continue;
      }

      const activeTweens = sequenceActiveTweens.get(seqEntity);
      if (activeTweens && activeTweens.size > 0) {
        for (const tweenEntity of activeTweens) {
          if (!state.hasComponent(tweenEntity, Tween)) {
            activeTweens.delete(tweenEntity);
          }
        }
        if (activeTweens.size > 0) {
          continue;
        }
        activateSequenceItems(state, seqEntity);
        continue;
      }

      if (Sequence.currentIndex[seqEntity] >= Sequence.itemCount[seqEntity]) {
        Sequence.state[seqEntity] = SequenceState.Idle;
        Sequence.currentIndex[seqEntity] = 0;
        Sequence.pauseRemaining[seqEntity] = 0;
        continue;
      }

      activateSequenceItems(state, seqEntity);
    }
  },
};

function getWorldTransformField(
  type: number,
  axisFlag: number
): Float32Array | null {
  if (type === TransformShakerType.Position) {
    if (axisFlag === TransformShakerAxes.X) return WorldTransform.posX;
    if (axisFlag === TransformShakerAxes.Y) return WorldTransform.posY;
    if (axisFlag === TransformShakerAxes.Z) return WorldTransform.posZ;
  } else if (type === TransformShakerType.Scale) {
    if (axisFlag === TransformShakerAxes.X) return WorldTransform.scaleX;
    if (axisFlag === TransformShakerAxes.Y) return WorldTransform.scaleY;
    if (axisFlag === TransformShakerAxes.Z) return WorldTransform.scaleZ;
  } else if (type === TransformShakerType.Rotation) {
    if (axisFlag === TransformShakerAxes.X) return WorldTransform.eulerX;
    if (axisFlag === TransformShakerAxes.Y) return WorldTransform.eulerY;
    if (axisFlag === TransformShakerAxes.Z) return WorldTransform.eulerZ;
  }
  return null;
}

export const TransformShakerApplySystem: System = {
  group: 'draw',
  first: true,
  update(state: State): void {
    const axisMasks = [
      TransformShakerAxes.X,
      TransformShakerAxes.Y,
      TransformShakerAxes.Z,
    ];

    for (const shakerEid of transformShakerQuery(state.world)) {
      const targetEid = TransformShaker.target[shakerEid];
      if (!state.hasComponent(targetEid, WorldTransform)) continue;

      const type = TransformShaker.type[shakerEid];
      const axes = TransformShaker.axes[shakerEid];

      if (type === TransformShakerType.Rotation) {
        if (!transformShakerQuatRegistry.has(targetEid)) {
          transformShakerQuatRegistry.set(targetEid, {
            x: WorldTransform.rotX[targetEid],
            y: WorldTransform.rotY[targetEid],
            z: WorldTransform.rotZ[targetEid],
            w: WorldTransform.rotW[targetEid],
          });
        }
      } else {
        for (const axisMask of axisMasks) {
          if (!(axes & axisMask)) continue;
          const array = getWorldTransformField(type, axisMask);
          if (!array) continue;
          transformShakerBaseRegistry.set(
            `${shakerEid}-${axisMask}`,
            array[targetEid]
          );
        }
      }
    }

    for (const shakerEid of transformShakerQuery(state.world)) {
      if (TransformShaker.mode[shakerEid] !== ShakerMode.Additive) continue;
      const targetEid = TransformShaker.target[shakerEid];
      if (!state.hasComponent(targetEid, WorldTransform)) continue;

      const type = TransformShaker.type[shakerEid];
      if (type === TransformShakerType.Rotation) continue;

      const axes = TransformShaker.axes[shakerEid];
      const value = TransformShaker.value[shakerEid];
      const intensity = TransformShaker.intensity[shakerEid];

      for (const axisMask of axisMasks) {
        if (!(axes & axisMask)) continue;
        const array = getWorldTransformField(type, axisMask);
        if (!array) continue;
        array[targetEid] += value * intensity;
      }
    }

    for (const shakerEid of transformShakerQuery(state.world)) {
      if (TransformShaker.mode[shakerEid] !== ShakerMode.Multiplicative)
        continue;
      const targetEid = TransformShaker.target[shakerEid];
      if (!state.hasComponent(targetEid, WorldTransform)) continue;

      const type = TransformShaker.type[shakerEid];
      if (type === TransformShakerType.Rotation) continue;

      const axes = TransformShaker.axes[shakerEid];
      const value = TransformShaker.value[shakerEid];
      const intensity = TransformShaker.intensity[shakerEid];

      for (const axisMask of axisMasks) {
        if (!(axes & axisMask)) continue;
        const array = getWorldTransformField(type, axisMask);
        if (!array) continue;
        array[targetEid] *= 1 + (value - 1) * intensity;
      }
    }

    for (const shakerEid of transformShakerQuery(state.world)) {
      const type = TransformShaker.type[shakerEid];
      if (type !== TransformShakerType.Rotation) continue;

      const targetEid = TransformShaker.target[shakerEid];
      if (!state.hasComponent(targetEid, WorldTransform)) continue;

      const axes = TransformShaker.axes[shakerEid];
      const value = TransformShaker.value[shakerEid];
      const intensity = TransformShaker.intensity[shakerEid];
      const effectValue = value * intensity * DEG_TO_RAD;

      const ex = axes & TransformShakerAxes.X ? effectValue : 0;
      const ey = axes & TransformShakerAxes.Y ? effectValue : 0;
      const ez = axes & TransformShakerAxes.Z ? effectValue : 0;

      tempEuler.set(ex, ey, ez, 'YXZ');
      tempQuat.setFromEuler(tempEuler);

      const currentQuat = new THREE.Quaternion(
        WorldTransform.rotX[targetEid],
        WorldTransform.rotY[targetEid],
        WorldTransform.rotZ[targetEid],
        WorldTransform.rotW[targetEid]
      );

      currentQuat.multiply(tempQuat);

      WorldTransform.rotX[targetEid] = currentQuat.x;
      WorldTransform.rotY[targetEid] = currentQuat.y;
      WorldTransform.rotZ[targetEid] = currentQuat.z;
      WorldTransform.rotW[targetEid] = currentQuat.w;
    }
  },
};

export const TransformShakerRestoreSystem: System = {
  group: 'draw',
  last: true,
  update(state: State): void {
    const axisMasks = [
      TransformShakerAxes.X,
      TransformShakerAxes.Y,
      TransformShakerAxes.Z,
    ];

    for (const shakerEid of transformShakerQuery(state.world)) {
      const targetEid = TransformShaker.target[shakerEid];
      if (!state.hasComponent(targetEid, WorldTransform)) continue;

      const type = TransformShaker.type[shakerEid];
      if (type === TransformShakerType.Rotation) continue;

      const axes = TransformShaker.axes[shakerEid];

      for (const axisMask of axisMasks) {
        if (!(axes & axisMask)) continue;
        const array = getWorldTransformField(type, axisMask);
        if (!array) continue;
        const key = `${shakerEid}-${axisMask}`;
        const baseValue = transformShakerBaseRegistry.get(key);
        if (baseValue !== undefined) {
          array[targetEid] = baseValue;
        }
      }
    }

    for (const [targetEid, baseQuat] of transformShakerQuatRegistry) {
      if (!state.hasComponent(targetEid, WorldTransform)) continue;
      WorldTransform.rotX[targetEid] = baseQuat.x;
      WorldTransform.rotY[targetEid] = baseQuat.y;
      WorldTransform.rotZ[targetEid] = baseQuat.z;
      WorldTransform.rotW[targetEid] = baseQuat.w;
    }
    transformShakerQuatRegistry.clear();
  },
};

export const TransformShakerCleanupSystem: System = {
  group: 'simulation',
  last: true,
  update(state: State): void {
    for (const key of transformShakerBaseRegistry.keys()) {
      const shakerEid = parseInt(key.split('-')[0], 10);
      if (!state.hasComponent(shakerEid, TransformShaker)) {
        transformShakerBaseRegistry.delete(key);
      }
    }
  },
};

export const ShakerApplySystem: System = {
  group: 'draw',
  first: true,
  before: [TransformShakerApplySystem],
  update(state: State): void {
    for (const shakerEid of shakerQuery(state.world)) {
      const targetEid = Shaker.target[shakerEid];
      const array = shakerFieldRegistry.get(shakerEid);
      if (!array) continue;
      shakerBaseRegistry.set(shakerEid, array[targetEid]);
    }

    for (const shakerEid of shakerQuery(state.world)) {
      if (Shaker.mode[shakerEid] !== ShakerMode.Additive) continue;
      const targetEid = Shaker.target[shakerEid];
      const array = shakerFieldRegistry.get(shakerEid);
      if (!array) continue;
      array[targetEid] += Shaker.value[shakerEid] * Shaker.intensity[shakerEid];
    }

    for (const shakerEid of shakerQuery(state.world)) {
      if (Shaker.mode[shakerEid] !== ShakerMode.Multiplicative) continue;
      const targetEid = Shaker.target[shakerEid];
      const array = shakerFieldRegistry.get(shakerEid);
      if (!array) continue;
      const intensity = Shaker.intensity[shakerEid];
      const value = Shaker.value[shakerEid];
      array[targetEid] *= 1 + (value - 1) * intensity;
    }
  },
};

export const ShakerRestoreSystem: System = {
  group: 'draw',
  last: true,
  before: [TransformShakerRestoreSystem],
  update(state: State): void {
    for (const shakerEid of shakerQuery(state.world)) {
      const targetEid = Shaker.target[shakerEid];
      const array = shakerFieldRegistry.get(shakerEid);
      if (!array) continue;
      const baseValue = shakerBaseRegistry.get(shakerEid);
      if (baseValue !== undefined) {
        array[targetEid] = baseValue;
      }
    }
  },
};

export const ShakerCleanupSystem: System = {
  group: 'simulation',
  last: true,
  before: [TransformShakerCleanupSystem],
  update(state: State): void {
    for (const shakerEid of shakerFieldRegistry.keys()) {
      if (!state.hasComponent(shakerEid, Shaker)) {
        shakerFieldRegistry.delete(shakerEid);
        shakerBaseRegistry.delete(shakerEid);
      }
    }
  },
};
