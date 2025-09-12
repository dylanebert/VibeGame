import type { State } from '../../core';
import {
  Body,
  CharacterController,
  CharacterMovement,
  SetAngularVelocity,
  SetLinearVelocity,
} from '../physics';
import { Player } from '../player';
import { Respawn } from './components';
import { Transform, eulerToQuaternion } from '../transforms';

export function respawnEntity(state: State, entity: number): void {
  if (!state.hasComponent(entity, Respawn)) return;

  const x = Respawn.posX[entity];
  const y = Respawn.posY[entity];
  const z = Respawn.posZ[entity];
  const eulerX = Respawn.eulerX[entity];
  const eulerY = Respawn.eulerY[entity];
  const eulerZ = Respawn.eulerZ[entity];

  const quat = eulerToQuaternion(eulerX, eulerY, eulerZ);

  if (state.hasComponent(entity, Transform)) {
    Transform.posX[entity] = x;
    Transform.posY[entity] = y;
    Transform.posZ[entity] = z;
    Transform.eulerX[entity] = eulerX;
    Transform.eulerY[entity] = eulerY;
    Transform.eulerZ[entity] = eulerZ;
    Transform.rotX[entity] = quat.x;
    Transform.rotY[entity] = quat.y;
    Transform.rotZ[entity] = quat.z;
    Transform.rotW[entity] = quat.w;
  }

  if (state.hasComponent(entity, Body)) {
    Body.posX[entity] = x;
    Body.posY[entity] = y;
    Body.posZ[entity] = z;
    Body.rotX[entity] = quat.x;
    Body.rotY[entity] = quat.y;
    Body.rotZ[entity] = quat.z;
    Body.rotW[entity] = quat.w;
    Body.velX[entity] = 0;
    Body.velY[entity] = 0;
    Body.velZ[entity] = 0;
    Body.rotVelX[entity] = 0;
    Body.rotVelY[entity] = 0;
    Body.rotVelZ[entity] = 0;

    state.addComponent(entity, SetLinearVelocity);
    SetLinearVelocity.x[entity] = 0;
    SetLinearVelocity.y[entity] = 0;
    SetLinearVelocity.z[entity] = 0;

    state.addComponent(entity, SetAngularVelocity);
    SetAngularVelocity.x[entity] = 0;
    SetAngularVelocity.y[entity] = 0;
    SetAngularVelocity.z[entity] = 0;
  }

  if (state.hasComponent(entity, CharacterController)) {
    CharacterController.moveX[entity] = 0;
    CharacterController.moveY[entity] = 0;
    CharacterController.moveZ[entity] = 0;
    CharacterController.grounded[entity] = 0;
  }

  if (state.hasComponent(entity, CharacterMovement)) {
    CharacterMovement.desiredVelX[entity] = 0;
    CharacterMovement.desiredVelY[entity] = 0;
    CharacterMovement.desiredVelZ[entity] = 0;
    CharacterMovement.velocityY[entity] = 0;
  }

  if (state.hasComponent(entity, Player)) {
    Player.canJump[entity] = 1;
    Player.isJumping[entity] = 0;
    Player.jumpCooldown[entity] = 0;
  }
}
