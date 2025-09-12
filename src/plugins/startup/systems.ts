import { AnimatedCharacter } from '../animation';
import { NULL_ENTITY, defineQuery, type System } from '../../core';
import { InputState } from '../input';
import {
  CAMERA_TRANSFORM_DEFAULTS,
  ORBIT_CAMERA_DEFAULTS,
  OrbitCamera,
} from '../orbit-camera';
import {
  Body,
  CharacterController,
  CharacterMovement,
  Collider,
} from '../physics';
import {
  Player,
  PLAYER_BODY_DEFAULTS,
  PLAYER_CHARACTER_CONTROLLER_DEFAULTS,
  PLAYER_COLLIDER_DEFAULTS,
  PLAYER_DEFAULTS,
} from '../player';
import { Parent } from '../recipes';
import {
  Ambient,
  AMBIENT_DEFAULTS,
  Directional,
  DIRECTIONAL_DEFAULTS,
  MainCamera,
} from '../rendering';
import { Respawn } from '../respawn';
import { Transform } from '../transforms';
import { HasAnimator } from '../animation/components';

// Query definitions
const ambientQuery = defineQuery([Ambient]);
const directionalQuery = defineQuery([Directional]);
const playersQuery = defineQuery([Player]);
const mainCameraQuery = defineQuery([MainCamera]);
const playersWithoutAnimatorQuery = defineQuery([Player]);

export const LightingStartupSystem: System = {
  group: 'setup',
  update: (state) => {
    const existingHemisphereLight = ambientQuery(state.world);
    const existingDirectionalLight = directionalQuery(state.world);

    if (
      existingHemisphereLight.length === 0 &&
      existingDirectionalLight.length === 0
    ) {
      const lightingEntity = state.createEntity();

      state.addComponent(lightingEntity, Ambient);
      state.addComponent(lightingEntity, Directional);

      Ambient.skyColor[lightingEntity] = AMBIENT_DEFAULTS.skyColor;
      Ambient.groundColor[lightingEntity] = AMBIENT_DEFAULTS.groundColor;
      Ambient.intensity[lightingEntity] = AMBIENT_DEFAULTS.intensity;

      Directional.color[lightingEntity] = DIRECTIONAL_DEFAULTS.color;
      Directional.intensity[lightingEntity] = DIRECTIONAL_DEFAULTS.intensity;
      Directional.castShadow[lightingEntity] = DIRECTIONAL_DEFAULTS.castShadow;
      Directional.shadowMapSize[lightingEntity] =
        DIRECTIONAL_DEFAULTS.shadowMapSize;
      Directional.directionX[lightingEntity] = DIRECTIONAL_DEFAULTS.directionX;
      Directional.directionY[lightingEntity] = DIRECTIONAL_DEFAULTS.directionY;
      Directional.directionZ[lightingEntity] = DIRECTIONAL_DEFAULTS.directionZ;
      Directional.distance[lightingEntity] = DIRECTIONAL_DEFAULTS.distance;
    }
  },
};

export const PlayerStartupSystem: System = {
  group: 'setup',
  update: (state) => {
    const existingPlayers = playersQuery(state.world);
    if (existingPlayers.length === 0) {
      const entity = state.createEntity();

      state.addComponent(entity, Player);
      Player.speed[entity] = PLAYER_DEFAULTS.speed;
      Player.jumpHeight[entity] = PLAYER_DEFAULTS.jumpHeight;
      Player.rotationSpeed[entity] = PLAYER_DEFAULTS.rotationSpeed;
      Player.canJump[entity] = PLAYER_DEFAULTS.canJump;
      Player.isJumping[entity] = PLAYER_DEFAULTS.isJumping;
      Player.jumpCooldown[entity] = PLAYER_DEFAULTS.jumpCooldown;
      Player.lastGroundedTime[entity] = PLAYER_DEFAULTS.lastGroundedTime;
      Player.jumpBufferTime[entity] = PLAYER_DEFAULTS.jumpBufferTime;
      Player.cameraSensitivity[entity] = PLAYER_DEFAULTS.cameraSensitivity;
      Player.cameraZoomSensitivity[entity] =
        PLAYER_DEFAULTS.cameraZoomSensitivity;
      Player.cameraEntity[entity] = PLAYER_DEFAULTS.cameraEntity;

      state.addComponent(entity, CharacterMovement);

      state.addComponent(entity, Transform);
      Transform.rotW[entity] = 1;
      Transform.scaleX[entity] = 1;
      Transform.scaleY[entity] = 1;
      Transform.scaleZ[entity] = 1;

      state.addComponent(entity, Body);
      Body.type[entity] = PLAYER_BODY_DEFAULTS.type;
      Body.mass[entity] = PLAYER_BODY_DEFAULTS.mass;
      Body.posX[entity] = PLAYER_BODY_DEFAULTS.posX;
      Body.posY[entity] = PLAYER_BODY_DEFAULTS.posY;
      Body.posZ[entity] = PLAYER_BODY_DEFAULTS.posZ;
      Body.eulerX[entity] = PLAYER_BODY_DEFAULTS.eulerX;
      Body.eulerY[entity] = PLAYER_BODY_DEFAULTS.eulerY;
      Body.eulerZ[entity] = PLAYER_BODY_DEFAULTS.eulerZ;
      Body.rotX[entity] = 0;
      Body.rotY[entity] = 0;
      Body.rotZ[entity] = 0;
      Body.rotW[entity] = 1;
      Body.velX[entity] = PLAYER_BODY_DEFAULTS.velX;
      Body.velY[entity] = PLAYER_BODY_DEFAULTS.velY;
      Body.velZ[entity] = PLAYER_BODY_DEFAULTS.velZ;
      Body.rotVelX[entity] = PLAYER_BODY_DEFAULTS.rotVelX;
      Body.rotVelY[entity] = PLAYER_BODY_DEFAULTS.rotVelY;
      Body.rotVelZ[entity] = PLAYER_BODY_DEFAULTS.rotVelZ;
      Body.linearDamping[entity] = PLAYER_BODY_DEFAULTS.linearDamping;
      Body.angularDamping[entity] = PLAYER_BODY_DEFAULTS.angularDamping;
      Body.gravityScale[entity] = PLAYER_BODY_DEFAULTS.gravityScale;
      Body.ccd[entity] = PLAYER_BODY_DEFAULTS.ccd;
      Body.lockRotX[entity] = PLAYER_BODY_DEFAULTS.lockRotX;
      Body.lockRotY[entity] = PLAYER_BODY_DEFAULTS.lockRotY;
      Body.lockRotZ[entity] = PLAYER_BODY_DEFAULTS.lockRotZ;

      state.addComponent(entity, Collider);
      Collider.shape[entity] = PLAYER_COLLIDER_DEFAULTS.shape;
      Collider.radius[entity] = PLAYER_COLLIDER_DEFAULTS.radius;
      Collider.height[entity] = PLAYER_COLLIDER_DEFAULTS.height;
      Collider.sizeX[entity] = PLAYER_COLLIDER_DEFAULTS.sizeX;
      Collider.sizeY[entity] = PLAYER_COLLIDER_DEFAULTS.sizeY;
      Collider.sizeZ[entity] = PLAYER_COLLIDER_DEFAULTS.sizeZ;
      Collider.friction[entity] = PLAYER_COLLIDER_DEFAULTS.friction;
      Collider.restitution[entity] = PLAYER_COLLIDER_DEFAULTS.restitution;
      Collider.density[entity] = PLAYER_COLLIDER_DEFAULTS.density;
      Collider.isSensor[entity] = PLAYER_COLLIDER_DEFAULTS.isSensor;
      Collider.membershipGroups[entity] =
        PLAYER_COLLIDER_DEFAULTS.membershipGroups;
      Collider.filterGroups[entity] = PLAYER_COLLIDER_DEFAULTS.filterGroups;
      Collider.posOffsetX[entity] = PLAYER_COLLIDER_DEFAULTS.posOffsetX;
      Collider.posOffsetY[entity] = PLAYER_COLLIDER_DEFAULTS.posOffsetY;
      Collider.posOffsetZ[entity] = PLAYER_COLLIDER_DEFAULTS.posOffsetZ;
      Collider.rotOffsetX[entity] = PLAYER_COLLIDER_DEFAULTS.rotOffsetX;
      Collider.rotOffsetY[entity] = PLAYER_COLLIDER_DEFAULTS.rotOffsetY;
      Collider.rotOffsetZ[entity] = PLAYER_COLLIDER_DEFAULTS.rotOffsetZ;
      Collider.rotOffsetW[entity] = PLAYER_COLLIDER_DEFAULTS.rotOffsetW;

      state.addComponent(entity, CharacterController);
      CharacterController.offset[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.offset;
      CharacterController.maxSlope[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.maxSlope;
      CharacterController.maxSlide[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.maxSlide;
      CharacterController.snapDist[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.snapDist;
      CharacterController.autoStep[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.autoStep;
      CharacterController.maxStepHeight[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.maxStepHeight;
      CharacterController.minStepWidth[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.minStepWidth;
      CharacterController.upX[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.upX;
      CharacterController.upY[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.upY;
      CharacterController.upZ[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.upZ;
      CharacterController.moveX[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.moveX;
      CharacterController.moveY[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.moveY;
      CharacterController.moveZ[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.moveZ;
      CharacterController.grounded[entity] =
        PLAYER_CHARACTER_CONTROLLER_DEFAULTS.grounded;

      state.addComponent(entity, InputState);
      state.addComponent(entity, Respawn);
    }
  },
};

export const CameraStartupSystem: System = {
  group: 'setup',
  update: (state) => {
    const existingCameras = mainCameraQuery(state.world);
    if (existingCameras.length === 0) {
      const cameraEntity = state.createEntity();

      state.addComponent(cameraEntity, OrbitCamera);
      state.addComponent(cameraEntity, Transform);
      state.addComponent(cameraEntity, MainCamera);

      OrbitCamera.target[cameraEntity] = ORBIT_CAMERA_DEFAULTS.target;
      OrbitCamera.currentDistance[cameraEntity] =
        ORBIT_CAMERA_DEFAULTS.currentDistance;
      OrbitCamera.targetDistance[cameraEntity] =
        ORBIT_CAMERA_DEFAULTS.targetDistance;
      OrbitCamera.currentYaw[cameraEntity] = ORBIT_CAMERA_DEFAULTS.currentYaw;
      OrbitCamera.targetYaw[cameraEntity] = ORBIT_CAMERA_DEFAULTS.targetYaw;
      OrbitCamera.currentPitch[cameraEntity] =
        ORBIT_CAMERA_DEFAULTS.currentPitch;
      OrbitCamera.targetPitch[cameraEntity] = ORBIT_CAMERA_DEFAULTS.targetPitch;
      OrbitCamera.minDistance[cameraEntity] = ORBIT_CAMERA_DEFAULTS.minDistance;
      OrbitCamera.maxDistance[cameraEntity] = ORBIT_CAMERA_DEFAULTS.maxDistance;
      OrbitCamera.minPitch[cameraEntity] = ORBIT_CAMERA_DEFAULTS.minPitch;
      OrbitCamera.maxPitch[cameraEntity] = ORBIT_CAMERA_DEFAULTS.maxPitch;
      OrbitCamera.smoothness[cameraEntity] = ORBIT_CAMERA_DEFAULTS.smoothness;
      OrbitCamera.offsetX[cameraEntity] = ORBIT_CAMERA_DEFAULTS.offsetX;
      OrbitCamera.offsetY[cameraEntity] = ORBIT_CAMERA_DEFAULTS.offsetY;
      OrbitCamera.offsetZ[cameraEntity] = ORBIT_CAMERA_DEFAULTS.offsetZ;

      Transform.posX[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.posX;
      Transform.posY[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.posY;
      Transform.posZ[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.posZ;
      Transform.rotX[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.rotX;
      Transform.rotY[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.rotY;
      Transform.rotZ[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.rotZ;
      Transform.rotW[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.rotW;
      Transform.eulerX[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.eulerX;
      Transform.eulerY[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.eulerY;
      Transform.eulerZ[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.eulerZ;
      Transform.scaleX[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.scaleX;
      Transform.scaleY[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.scaleY;
      Transform.scaleZ[cameraEntity] = CAMERA_TRANSFORM_DEFAULTS.scaleZ;
    }
  },
};

export const PlayerCharacterSystem: System = {
  group: 'setup',
  update(state) {
    const playersWithoutCharacter = playersWithoutAnimatorQuery(
      state.world
    ).filter((entity) => !state.hasComponent(entity, HasAnimator));

    for (const player of playersWithoutCharacter) {
      const character = state.createEntity();
      state.addComponent(player, HasAnimator);
      state.addComponent(character, Transform);
      state.addComponent(character, Parent);
      state.addComponent(character, AnimatedCharacter);
      Transform.posX[character] = 0;
      Transform.posY[character] = 0.75;
      Transform.posZ[character] = 0;
      Transform.rotX[character] = 0;
      Transform.rotY[character] = 0;
      Transform.rotZ[character] = 0;
      Transform.rotW[character] = 1;
      Transform.scaleX[character] = 1;
      Transform.scaleY[character] = 1;
      Transform.scaleZ[character] = 1;
      Parent.entity[character] = player;
      AnimatedCharacter.headEntity[character] = NULL_ENTITY;
      AnimatedCharacter.torsoEntity[character] = NULL_ENTITY;
      AnimatedCharacter.leftArmEntity[character] = NULL_ENTITY;
      AnimatedCharacter.rightArmEntity[character] = NULL_ENTITY;
      AnimatedCharacter.leftLegEntity[character] = NULL_ENTITY;
      AnimatedCharacter.rightLegEntity[character] = NULL_ENTITY;
    }
  },
};
