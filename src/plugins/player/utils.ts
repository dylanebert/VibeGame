import { INPUT_CONFIG } from '../input';
import {
  Body,
  CharacterController,
  CharacterMovement,
  DEFAULT_GRAVITY,
} from '../physics';
import { Player } from './components';
import * as THREE from 'three';

export const JUMP_CONSTANTS = {
  verticalVelocityThreshold: 0.001,
  cooldown: 0.2,
};

export function processInput(
  moveForward: number,
  moveRight: number,
  cameraYaw: number
): THREE.Vector3 {
  const inputVector = new THREE.Vector3(moveRight, 0, -moveForward);
  if (inputVector.length() > 0) {
    inputVector.normalize();
    const rotationMatrix = new THREE.Matrix4().makeRotationY(cameraYaw);
    inputVector.applyMatrix4(rotationMatrix);
  }
  return inputVector;
}

function canPerformJump(entity: number, currentTime: number): boolean {
  const timeSinceGrounded = currentTime - Player.lastGroundedTime[entity];
  const timeSinceJumpPressed = currentTime - Player.jumpBufferTime[entity];
  const isGrounded = CharacterController.grounded[entity] === 1;

  return (
    timeSinceJumpPressed <= INPUT_CONFIG.bufferWindow &&
    Player.canJump[entity] === 1 &&
    (isGrounded || timeSinceGrounded <= INPUT_CONFIG.gracePeriods.coyoteTime)
  );
}

function calculateJumpVelocity(entity: number): number {
  const gravityScale = Body.gravityScale[entity];
  const gravity = Math.abs(DEFAULT_GRAVITY * gravityScale);
  return Math.sqrt(2 * gravity * Player.jumpHeight[entity]);
}

export function handleJump(
  entity: number,
  jumpPressed: number,
  currentTime: number
): number {
  if (jumpPressed === 1) {
    Player.jumpBufferTime[entity] = currentTime;
  }

  if (canPerformJump(entity, currentTime)) {
    const jumpVelocity = calculateJumpVelocity(entity);
    CharacterMovement.velocityY[entity] = jumpVelocity;
    Player.isJumping[entity] = 1;
    Player.canJump[entity] = 0;
    Player.jumpCooldown[entity] = JUMP_CONSTANTS.cooldown;
    Player.jumpBufferTime[entity] = -10000;
    return jumpVelocity;
  }

  return 0;
}

function calculateSlerpFactor(
  currentQuat: THREE.Quaternion,
  targetQuat: THREE.Quaternion,
  maxRotation: number
): number {
  const dotProduct = currentQuat.dot(targetQuat);
  const angle = 2 * Math.acos(Math.min(1, Math.abs(dotProduct)));
  return angle > 0.001 ? Math.min(1.0, maxRotation / angle) : 1.0;
}

export function updateRotation(
  entity: number,
  inputVector: THREE.Vector3,
  deltaTime: number,
  rotationData: {
    rotX: number;
    rotY: number;
    rotZ: number;
    rotW: number;
  }
): { x: number; y: number; z: number; w: number } {
  if (inputVector.length() <= JUMP_CONSTANTS.verticalVelocityThreshold) {
    return {
      x: rotationData.rotX,
      y: rotationData.rotY,
      z: rotationData.rotZ,
      w: rotationData.rotW,
    };
  }

  const targetYRotation = Math.atan2(inputVector.x, inputVector.z);
  const targetQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, targetYRotation, 0)
  );

  const currentQuaternion = new THREE.Quaternion(
    rotationData.rotX,
    rotationData.rotY,
    rotationData.rotZ,
    rotationData.rotW
  );

  const maxRotationRadians = Player.rotationSpeed[entity] * deltaTime;
  const slerpFactor = calculateSlerpFactor(
    currentQuaternion,
    targetQuaternion,
    maxRotationRadians
  );

  currentQuaternion.slerp(targetQuaternion, slerpFactor);

  return {
    x: currentQuaternion.x,
    y: currentQuaternion.y,
    z: currentQuaternion.z,
    w: currentQuaternion.w,
  };
}
