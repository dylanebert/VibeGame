import { defineQuery, type System } from '../../core';
import { InputState } from '../input';
import { OrbitCamera } from '../orbit-camera';
import { Body, CharacterController, CharacterMovement } from '../physics';
import { Transform } from '../transforms';
import { Player } from './components';
import { handleJump, processInput, updateRotation } from './utils';

// Query definitions
const playerMovementQuery = defineQuery([
  Player,
  CharacterMovement,
  Transform,
  Body,
  InputState,
]);
const orbitCameraQuery = defineQuery([OrbitCamera]);
const playerGroundedQuery = defineQuery([
  Player,
  CharacterMovement,
  CharacterController,
  InputState,
  Body,
]);
const playersQuery = defineQuery([Player]);
const playerCameraControlQuery = defineQuery([Player, InputState]);

export const PlayerMovementSystem: System = {
  group: 'fixed',
  update: (state) => {
    const playerEntities = playerMovementQuery(state.world);

    const cameraEntities = orbitCameraQuery(state.world);
    const cameraEntity = cameraEntities.length > 0 ? cameraEntities[0] : null;
    const cameraYaw =
      cameraEntity !== null ? OrbitCamera.currentYaw[cameraEntity] : 0;
    const deltaTime = state.time.fixedDeltaTime;

    for (const entity of playerEntities) {
      const inputVector = processInput(
        InputState.moveY[entity],
        InputState.moveX[entity],
        cameraYaw
      );

      const speed = Player.speed[entity];
      const horizontalVelX = inputVector.x * speed;
      const horizontalVelZ = inputVector.z * speed;

      const jumpVelocity = handleJump(
        entity,
        InputState.jump[entity],
        state.time.elapsed * 1000
      );

      CharacterMovement.desiredVelX[entity] = horizontalVelX;
      CharacterMovement.desiredVelZ[entity] = horizontalVelZ;

      if (jumpVelocity > 0) {
        CharacterMovement.velocityY[entity] = jumpVelocity;
      }
      CharacterMovement.desiredVelY[entity] = 0;

      if (Player.jumpCooldown[entity] > 0) {
        Player.jumpCooldown[entity] -= deltaTime;
        if (Player.jumpCooldown[entity] <= 0) {
          Player.jumpCooldown[entity] = 0;
          Player.canJump[entity] = 1;
        }
      }

      const newRotation = updateRotation(entity, inputVector, deltaTime, {
        rotX: Body.rotX[entity],
        rotY: Body.rotY[entity],
        rotZ: Body.rotZ[entity],
        rotW: Body.rotW[entity],
      });

      Body.rotX[entity] = newRotation.x;
      Body.rotY[entity] = newRotation.y;
      Body.rotZ[entity] = newRotation.z;
      Body.rotW[entity] = newRotation.w;
    }
  },
};

export const PlayerGroundedSystem: System = {
  group: 'fixed',
  before: [PlayerMovementSystem],
  update: (state) => {
    const players = playerGroundedQuery(state.world);

    for (const entity of players) {
      const isGrounded = CharacterController.grounded[entity] === 1;
      const wasJumping = Player.isJumping[entity] === 1;

      if (isGrounded) {
        Player.lastGroundedTime[entity] = state.time.elapsed * 1000;

        if (wasJumping) {
          Player.isJumping[entity] = 0;
        }

        if (Player.canJump[entity] === 0 && Player.jumpCooldown[entity] <= 0) {
          Player.canJump[entity] = 1;
        }
      }
    }
  },
};

export const PlayerCameraLinkingSystem: System = {
  group: 'simulation',
  update: (state) => {
    const players = playersQuery(state.world);
    const cameras = orbitCameraQuery(state.world);

    for (const player of players) {
      if (Player.cameraEntity[player] === 0 && cameras.length > 0) {
        const camera = cameras[0];
        Player.cameraEntity[player] = camera;
        OrbitCamera.target[camera] = player;
      }
    }
  },
};

export const PlayerCameraControlSystem: System = {
  group: 'simulation',
  after: [PlayerCameraLinkingSystem],
  update: (state) => {
    const playerEntities = playerCameraControlQuery(state.world);

    for (const entity of playerEntities) {
      const cameraEntity = Player.cameraEntity[entity];
      if (!cameraEntity || !state.hasComponent(cameraEntity, OrbitCamera)) {
        continue;
      }

      const sensitivity = Player.cameraSensitivity[entity];
      const zoomSensitivity = Player.cameraZoomSensitivity[entity];
      const lookX = InputState.lookX[entity];
      const lookY = InputState.lookY[entity];
      const scrollDelta = InputState.scrollDelta[entity];
      const rightMouseHeld = InputState.rightMouse[entity] === 1;

      if (rightMouseHeld) {
        OrbitCamera.targetYaw[cameraEntity] -= lookX * sensitivity;

        const currentPitch = OrbitCamera.targetPitch[cameraEntity];
        const newPitch = currentPitch + lookY * sensitivity;
        const minPitch = OrbitCamera.minPitch[cameraEntity];
        const maxPitch = OrbitCamera.maxPitch[cameraEntity];

        OrbitCamera.targetPitch[cameraEntity] = Math.max(
          minPitch,
          Math.min(maxPitch, newPitch)
        );
      }

      if (scrollDelta !== 0) {
        const currentDistance = OrbitCamera.targetDistance[cameraEntity];
        const minDistance = OrbitCamera.minDistance[cameraEntity];
        const maxDistance = OrbitCamera.maxDistance[cameraEntity];

        const distanceScale = Math.max(0.3, currentDistance * 0.08);
        const zoomDelta = scrollDelta * zoomSensitivity * distanceScale;
        const newDistance = currentDistance + zoomDelta;

        OrbitCamera.targetDistance[cameraEntity] = Math.max(
          minDistance,
          Math.min(maxDistance, newDistance)
        );
      }
    }
  },
};
