import type { State } from '../../core';
import { Parent } from '../recipes';
import { Renderer } from '../rendering';
import { Transform } from '../transforms';
import { ANIMATION_CONFIG, BODY_PARTS } from './constants';

export function createBodyPart(
  state: State,
  parentEntity: number,
  partName: keyof typeof BODY_PARTS
): number {
  const part = BODY_PARTS[partName];
  const entity = state.createEntity();

  state.addComponent(entity, Transform);
  state.addComponent(entity, Renderer);
  state.addComponent(entity, Parent);

  Transform.posX[entity] = part.offset.x;
  Transform.posY[entity] = part.offset.y;
  Transform.posZ[entity] = part.offset.z;
  Transform.rotX[entity] = 0;
  Transform.rotY[entity] = 0;
  Transform.rotZ[entity] = 0;
  Transform.rotW[entity] = 1;
  Transform.scaleX[entity] = 1;
  Transform.scaleY[entity] = 1;
  Transform.scaleZ[entity] = 1;

  Renderer.shape[entity] = 0; // BOX
  Renderer.sizeX[entity] = part.size.x;
  Renderer.sizeY[entity] = part.size.y;
  Renderer.sizeZ[entity] = part.size.z;
  Renderer.color[entity] = part.color;
  Renderer.visible[entity] = 1;

  Parent.entity[entity] = parentEntity;

  return entity;
}

export function calculateWalkAnimation(phase: number): {
  armRotation: number;
  legRotation: number;
} {
  const p = phase * Math.PI * 2;
  return {
    armRotation: Math.sin(p) * ANIMATION_CONFIG.armSwingAngle,
    legRotation: Math.sin(p) * ANIMATION_CONFIG.legSwingAngle,
  };
}

export function applyWalkAnimation(
  leftArmEntity: number,
  rightArmEntity: number,
  leftLegEntity: number,
  rightLegEntity: number,
  phase: number
): void {
  const { armRotation, legRotation } = calculateWalkAnimation(phase);

  Transform.eulerX[leftArmEntity] = -armRotation;
  Transform.eulerX[rightArmEntity] = armRotation;
  Transform.eulerX[leftLegEntity] = legRotation;
  Transform.eulerX[rightLegEntity] = -legRotation;
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function applyJumpAnimation(
  headEntity: number,
  torsoEntity: number,
  leftArmEntity: number,
  rightArmEntity: number,
  leftLegEntity: number,
  rightLegEntity: number,
  jumpTime: number
): void {
  if (jumpTime < ANIMATION_CONFIG.jump.anticipationDuration) {
    const takeoffProgress =
      jumpTime / ANIMATION_CONFIG.jump.anticipationDuration;
    const eased = easeOutCubic(takeoffProgress);

    Transform.eulerX[leftArmEntity] =
      -eased * ANIMATION_CONFIG.jump.armRaiseAngle;
    Transform.eulerX[rightArmEntity] =
      -eased * ANIMATION_CONFIG.jump.armRaiseAngle;

    const stretchAmount = eased * ANIMATION_CONFIG.jump.bodyStretch;
    Transform.scaleY[torsoEntity] = 1 + stretchAmount;
    Transform.scaleX[torsoEntity] = 1 - stretchAmount * 0.3;
    Transform.scaleZ[torsoEntity] = 1 - stretchAmount * 0.3;

    const legRotation = eased * ANIMATION_CONFIG.jump.legTuckAngle;
    Transform.eulerX[leftLegEntity] = legRotation;
    Transform.eulerX[rightLegEntity] = legRotation;
  } else {
    const airTime = jumpTime - ANIMATION_CONFIG.jump.anticipationDuration;
    const armSway = Math.sin(airTime * 3) * 5;

    Transform.eulerX[leftArmEntity] =
      -ANIMATION_CONFIG.jump.armRaiseAngle + armSway;
    Transform.eulerX[rightArmEntity] =
      -ANIMATION_CONFIG.jump.armRaiseAngle - armSway;

    const breathe = Math.sin(airTime * 4) * 0.02;
    Transform.scaleX[torsoEntity] = 1 + breathe;
    Transform.scaleY[torsoEntity] = 1;
    Transform.scaleZ[torsoEntity] = 1 + breathe;

    Transform.eulerX[leftLegEntity] = ANIMATION_CONFIG.jump.legTuckAngle;
    Transform.eulerX[rightLegEntity] = ANIMATION_CONFIG.jump.legTuckAngle;

    Transform.eulerX[headEntity] = 10;
  }
}

export function applyFallAnimation(
  headEntity: number,
  torsoEntity: number,
  leftArmEntity: number,
  rightArmEntity: number,
  leftLegEntity: number,
  rightLegEntity: number,
  fallTime: number
): void {
  const adjustedFallTime = Math.max(0, fallTime - 0.3);

  const armFlail =
    Math.sin(adjustedFallTime * 5) * ANIMATION_CONFIG.fall.armFlailAngle;
  Transform.eulerX[leftArmEntity] = -12 + armFlail;
  Transform.eulerX[rightArmEntity] = -12 - armFlail;
  Transform.eulerZ[leftArmEntity] = -20;
  Transform.eulerZ[rightArmEntity] = 20;

  Transform.eulerX[torsoEntity] = ANIMATION_CONFIG.fall.bodyTiltAngle;

  Transform.eulerX[leftLegEntity] = ANIMATION_CONFIG.fall.legDangleAngle;
  Transform.eulerX[rightLegEntity] = ANIMATION_CONFIG.fall.legDangleAngle;

  Transform.eulerX[headEntity] = 20;

  const windSway =
    Math.sin(adjustedFallTime * 2.5) * ANIMATION_CONFIG.fall.windSwayAmount;
  Transform.posX[torsoEntity] = windSway;
  Transform.posX[headEntity] = windSway * 0.5;
}

export function applyLandingAnimation(
  headEntity: number,
  torsoEntity: number,
  landingTime: number
): void {
  const landingProgress = landingTime / ANIMATION_CONFIG.landing.duration;

  const bounceAmount =
    Math.exp(-landingProgress * 8) * ANIMATION_CONFIG.landing.bounceHeight;
  const bouncePhase = Math.sin(landingProgress * Math.PI * 2) * bounceAmount;

  Transform.posY[torsoEntity] = BODY_PARTS.torso.offset.y + bouncePhase;
  Transform.posY[headEntity] = BODY_PARTS.head.offset.y + bouncePhase;

  const squash =
    Math.exp(-landingProgress * 6) * ANIMATION_CONFIG.landing.squashAmount;
  Transform.scaleX[torsoEntity] = 1 + squash * 0.4;
  Transform.scaleY[torsoEntity] = 1 - squash * 0.8;
  Transform.scaleZ[torsoEntity] = 1 + squash * 0.4;
}

export function resetBodyPartTransforms(
  headEntity: number,
  torsoEntity: number,
  leftArmEntity: number,
  rightArmEntity: number,
  leftLegEntity: number,
  rightLegEntity: number
): void {
  Transform.posX[headEntity] = BODY_PARTS.head.offset.x;
  Transform.posY[headEntity] = BODY_PARTS.head.offset.y;
  Transform.posZ[headEntity] = BODY_PARTS.head.offset.z;

  Transform.posX[torsoEntity] = BODY_PARTS.torso.offset.x;
  Transform.posY[torsoEntity] = BODY_PARTS.torso.offset.y;
  Transform.posZ[torsoEntity] = BODY_PARTS.torso.offset.z;

  Transform.eulerX[headEntity] = 0;
  Transform.eulerY[headEntity] = 0;
  Transform.eulerZ[headEntity] = 0;

  Transform.eulerX[torsoEntity] = 0;
  Transform.eulerY[torsoEntity] = 0;
  Transform.eulerZ[torsoEntity] = 0;

  Transform.eulerX[leftArmEntity] = 0;
  Transform.eulerY[leftArmEntity] = 0;
  Transform.eulerZ[leftArmEntity] = 0;

  Transform.eulerX[rightArmEntity] = 0;
  Transform.eulerY[rightArmEntity] = 0;
  Transform.eulerZ[rightArmEntity] = 0;

  Transform.eulerX[leftLegEntity] = 0;
  Transform.eulerY[leftLegEntity] = 0;
  Transform.eulerZ[leftLegEntity] = 0;

  Transform.eulerX[rightLegEntity] = 0;
  Transform.eulerY[rightLegEntity] = 0;
  Transform.eulerZ[rightLegEntity] = 0;

  Transform.scaleX[headEntity] = 1;
  Transform.scaleY[headEntity] = 1;
  Transform.scaleZ[headEntity] = 1;

  Transform.scaleX[torsoEntity] = 1;
  Transform.scaleY[torsoEntity] = 1;
  Transform.scaleZ[torsoEntity] = 1;
}
