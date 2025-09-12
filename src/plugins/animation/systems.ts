import { defineQuery, type System } from '../../core';
import { NULL_ENTITY } from '../../core';
import { CharacterController, InterpolatedTransform } from '../physics';
import { Parent } from '../recipes';
import { AnimatedCharacter } from './components';
import { ANIMATION_CONFIG, ANIMATION_STATES } from './constants';
import {
  applyWalkAnimation,
  applyJumpAnimation,
  applyFallAnimation,
  applyLandingAnimation,
  createBodyPart,
  resetBodyPartTransforms,
} from './utils';

// Query definitions
const animatedCharacterQuery = defineQuery([AnimatedCharacter]);

export const AnimatedCharacterInitializationSystem: System = {
  group: 'setup',
  update(state) {
    const uninitialized = animatedCharacterQuery(state.world).filter(
      (entity) => {
        const headEntity = AnimatedCharacter.headEntity[entity];
        return headEntity === NULL_ENTITY;
      }
    );

    for (const entity of uninitialized) {
      AnimatedCharacter.headEntity[entity] = createBodyPart(
        state,
        entity,
        'head'
      );
      AnimatedCharacter.torsoEntity[entity] = createBodyPart(
        state,
        entity,
        'torso'
      );
      AnimatedCharacter.leftArmEntity[entity] = createBodyPart(
        state,
        entity,
        'leftArm'
      );
      AnimatedCharacter.rightArmEntity[entity] = createBodyPart(
        state,
        entity,
        'rightArm'
      );
      AnimatedCharacter.leftLegEntity[entity] = createBodyPart(
        state,
        entity,
        'leftLeg'
      );
      AnimatedCharacter.rightLegEntity[entity] = createBodyPart(
        state,
        entity,
        'rightLeg'
      );
    }
  },
};

export const AnimatedCharacterUpdateSystem: System = {
  group: 'simulation',
  update(state) {
    const characters = animatedCharacterQuery(state.world);
    const deltaTime = state.time.deltaTime;
    const fixedDeltaTime = state.time.fixedDeltaTime;

    for (const character of characters) {
      if (Parent.entity[character] === NULL_ENTITY) continue;
      const player = Parent.entity[character];

      const posX = InterpolatedTransform.posX[player];
      const posY = InterpolatedTransform.posY[player];
      const posZ = InterpolatedTransform.posZ[player];
      const prevPosX = InterpolatedTransform.prevPosX[player];
      const prevPosY = InterpolatedTransform.prevPosY[player];
      const prevPosZ = InterpolatedTransform.prevPosZ[player];
      const isGrounded = CharacterController.grounded[player] === 1;

      const moveX = posX - prevPosX;
      const moveZ = posZ - prevPosZ;
      const verticalVelocity = (posY - prevPosY) / fixedDeltaTime;
      const speed = Math.sqrt(moveX * moveX + moveZ * moveZ) / fixedDeltaTime;
      const isMoving = speed > 0.5;

      const prevState = AnimatedCharacter.animationState[character];
      let currentState = prevState;

      resetBodyPartTransforms(
        AnimatedCharacter.headEntity[character],
        AnimatedCharacter.torsoEntity[character],
        AnimatedCharacter.leftArmEntity[character],
        AnimatedCharacter.rightArmEntity[character],
        AnimatedCharacter.leftLegEntity[character],
        AnimatedCharacter.rightLegEntity[character]
      );

      if (!isGrounded) {
        if (verticalVelocity > 1.0) {
          currentState = ANIMATION_STATES.JUMPING;
          if (prevState !== ANIMATION_STATES.JUMPING) {
            AnimatedCharacter.jumpTime[character] = 0;
          }
          AnimatedCharacter.jumpTime[character] += deltaTime;
        } else {
          currentState = ANIMATION_STATES.FALLING;
          if (prevState !== ANIMATION_STATES.FALLING) {
            AnimatedCharacter.fallTime[character] = 0;
          }
          AnimatedCharacter.fallTime[character] += deltaTime;
        }
      } else {
        if (
          prevState === ANIMATION_STATES.FALLING ||
          prevState === ANIMATION_STATES.JUMPING
        ) {
          currentState = ANIMATION_STATES.LANDING;
          AnimatedCharacter.stateTransition[character] = 0;
        } else if (
          AnimatedCharacter.animationState[character] ===
          ANIMATION_STATES.LANDING
        ) {
          AnimatedCharacter.stateTransition[character] += deltaTime;
          if (
            AnimatedCharacter.stateTransition[character] >=
            ANIMATION_CONFIG.landing.duration
          ) {
            currentState = isMoving
              ? ANIMATION_STATES.WALKING
              : ANIMATION_STATES.IDLE;
          } else {
            currentState = ANIMATION_STATES.LANDING;
          }
        } else if (isMoving) {
          currentState = ANIMATION_STATES.WALKING;
          AnimatedCharacter.phase[character] +=
            deltaTime * speed * ANIMATION_CONFIG.frequency;
          if (AnimatedCharacter.phase[character] >= 1.0) {
            AnimatedCharacter.phase[character] -= 1.0;
          }
        } else {
          currentState = ANIMATION_STATES.IDLE;
        }
      }

      AnimatedCharacter.animationState[character] = currentState;

      switch (currentState) {
        case ANIMATION_STATES.WALKING:
          applyWalkAnimation(
            AnimatedCharacter.leftArmEntity[character],
            AnimatedCharacter.rightArmEntity[character],
            AnimatedCharacter.leftLegEntity[character],
            AnimatedCharacter.rightLegEntity[character],
            AnimatedCharacter.phase[character]
          );
          break;

        case ANIMATION_STATES.JUMPING:
          applyJumpAnimation(
            AnimatedCharacter.headEntity[character],
            AnimatedCharacter.torsoEntity[character],
            AnimatedCharacter.leftArmEntity[character],
            AnimatedCharacter.rightArmEntity[character],
            AnimatedCharacter.leftLegEntity[character],
            AnimatedCharacter.rightLegEntity[character],
            AnimatedCharacter.jumpTime[character]
          );
          break;

        case ANIMATION_STATES.FALLING:
          applyFallAnimation(
            AnimatedCharacter.headEntity[character],
            AnimatedCharacter.torsoEntity[character],
            AnimatedCharacter.leftArmEntity[character],
            AnimatedCharacter.rightArmEntity[character],
            AnimatedCharacter.leftLegEntity[character],
            AnimatedCharacter.rightLegEntity[character],
            AnimatedCharacter.fallTime[character]
          );
          break;

        case ANIMATION_STATES.LANDING:
          applyLandingAnimation(
            AnimatedCharacter.headEntity[character],
            AnimatedCharacter.torsoEntity[character],
            AnimatedCharacter.stateTransition[character]
          );
          break;

        case ANIMATION_STATES.IDLE:
        default:
          applyWalkAnimation(
            AnimatedCharacter.leftArmEntity[character],
            AnimatedCharacter.rightArmEntity[character],
            AnimatedCharacter.leftLegEntity[character],
            AnimatedCharacter.rightLegEntity[character],
            0
          );
          break;
      }
    }
  },
};
