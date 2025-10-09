import * as RAPIER from '@dimforge/rapier3d-compat';
import { ActiveCollisionTypes, ActiveEvents } from '@dimforge/rapier3d-compat';
import {
  defineQuery,
  NULL_ENTITY,
  TIME_CONSTANTS,
  type State,
} from '../../core';
import {
  eulerToQuaternion,
  quaternionToEuler,
  syncEulerFromQuaternion,
  Transform,
  WorldTransform,
} from '../transforms';
import {
  ApplyAngularImpulse,
  ApplyForce,
  ApplyImpulse,
  ApplyTorque,
  Body,
  BodyType,
  CharacterController,
  CharacterMovement,
  ColliderShape,
  InterpolatedTransform,
  KinematicAngularVelocity,
  KinematicMove,
  KinematicRotate,
  SetAngularVelocity,
  SetLinearVelocity,
} from './components';

export const DEFAULT_GRAVITY = -60;

const interpolatedTransformQuery = defineQuery([InterpolatedTransform]);

export function createRigidbodyDescriptor(
  type: number,
  position?: RAPIER.Vector3,
  rotation?: RAPIER.Quaternion
): RAPIER.RigidBodyDesc {
  let desc: RAPIER.RigidBodyDesc;

  switch (type) {
    case BodyType.Fixed:
      desc = RAPIER.RigidBodyDesc.fixed();
      break;
    case BodyType.Dynamic:
      desc = RAPIER.RigidBodyDesc.dynamic();
      break;
    case BodyType.KinematicVelocityBased:
      desc = RAPIER.RigidBodyDesc.kinematicVelocityBased();
      break;
    case BodyType.KinematicPositionBased:
      desc = RAPIER.RigidBodyDesc.kinematicPositionBased();
      break;
    default:
      desc = RAPIER.RigidBodyDesc.dynamic();
  }

  if (position) desc.setTranslation(position.x, position.y, position.z);
  if (rotation) desc.setRotation(rotation);

  return desc;
}

export function configureRigidbody(
  body: RAPIER.RigidBody,
  _entity: number,
  type: number,
  mass: number,
  velocity: RAPIER.Vector3,
  angularVelocity: RAPIER.Vector3,
  linearDamping: number,
  angularDamping: number,
  gravityScale: number,
  ccd: number,
  lockRotX: number,
  lockRotY: number,
  lockRotZ: number
): void {
  if (type === BodyType.Dynamic && mass > 0) {
    body.setAdditionalMass(mass, true);
  }

  body.setLinvel(velocity, true);
  body.setAngvel(angularVelocity, true);
  body.setLinearDamping(linearDamping);
  body.setAngularDamping(angularDamping);
  body.setGravityScale(gravityScale, true);
  body.enableCcd(!!ccd);

  if (lockRotX || lockRotY || lockRotZ) {
    body.setEnabledRotations(!lockRotX, !lockRotY, !lockRotZ, true);
  }
}

export function createColliderDescriptor(
  shape: number,
  sizeX: number,
  sizeY: number,
  sizeZ: number,
  radius: number,
  height: number,
  friction: number,
  restitution: number,
  density: number,
  isSensor: number,
  membershipGroups: number,
  filterGroups: number,
  offset: RAPIER.Vector3,
  rotationOffset: RAPIER.Quaternion,
  activeEvents: ActiveEvents = ActiveEvents.NONE
): RAPIER.ColliderDesc {
  let desc: RAPIER.ColliderDesc;

  switch (shape) {
    case ColliderShape.Box:
      desc = RAPIER.ColliderDesc.cuboid(sizeX / 2, sizeY / 2, sizeZ / 2);
      break;
    case ColliderShape.Sphere:
      desc = RAPIER.ColliderDesc.ball(sizeX / 2);
      break;
    case ColliderShape.Capsule:
      desc = RAPIER.ColliderDesc.capsule(height / 2, radius);
      break;
    default:
      desc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
  }

  desc.setFriction(friction);
  desc.setRestitution(restitution);

  if (isSensor) {
    desc.setSensor(true);
    desc.setDensity(0);
  } else {
    desc.setDensity(density);
  }

  const groups = membershipGroups || 0xffff;
  const filter = filterGroups || 0xffff;
  desc.setCollisionGroups((groups & 0xffff) | ((filter & 0xffff) << 16));

  desc.setTranslation(offset.x, offset.y, offset.z);
  desc.setRotation(rotationOffset);

  desc.activeEvents = activeEvents;
  desc.activeCollisionTypes = ActiveCollisionTypes.DEFAULT;

  return desc;
}

export function applyForceToEntity(
  entity: number,
  body: RAPIER.RigidBody,
  state: State
): void {
  if (Body.type[entity] === BodyType.Dynamic) {
    body.addForce(
      new RAPIER.Vector3(
        ApplyForce.x[entity],
        ApplyForce.y[entity],
        ApplyForce.z[entity]
      ),
      true
    );
  }
  state.removeComponent(entity, ApplyForce);
}

export function applyTorqueToEntity(
  entity: number,
  body: RAPIER.RigidBody,
  state: State
): void {
  if (Body.type[entity] === BodyType.Dynamic) {
    body.addTorque(
      new RAPIER.Vector3(
        ApplyTorque.x[entity],
        ApplyTorque.y[entity],
        ApplyTorque.z[entity]
      ),
      true
    );
  }
  state.removeComponent(entity, ApplyTorque);
}

export function applyImpulseToEntity(
  entity: number,
  body: RAPIER.RigidBody,
  state: State
): void {
  if (Body.type[entity] === BodyType.Dynamic) {
    body.applyImpulse(
      new RAPIER.Vector3(
        ApplyImpulse.x[entity],
        ApplyImpulse.y[entity],
        ApplyImpulse.z[entity]
      ),
      true
    );
  }
  state.removeComponent(entity, ApplyImpulse);
}

export function applyAngularImpulseToEntity(
  entity: number,
  body: RAPIER.RigidBody,
  state: State
): void {
  if (Body.type[entity] === BodyType.Dynamic) {
    body.applyTorqueImpulse(
      new RAPIER.Vector3(
        ApplyAngularImpulse.x[entity],
        ApplyAngularImpulse.y[entity],
        ApplyAngularImpulse.z[entity]
      ),
      true
    );
  }
  state.removeComponent(entity, ApplyAngularImpulse);
}

export function setLinearVelocityForEntity(
  entity: number,
  body: RAPIER.RigidBody,
  state: State
): void {
  const type = Body.type[entity];

  if (type === BodyType.Dynamic) {
    const currentVel = body.linvel();
    const targetVel = new RAPIER.Vector3(
      SetLinearVelocity.x[entity],
      SetLinearVelocity.y[entity],
      SetLinearVelocity.z[entity]
    );
    const deltaVel = new RAPIER.Vector3(
      targetVel.x - currentVel.x,
      targetVel.y - currentVel.y,
      targetVel.z - currentVel.z
    );
    const mass = body.mass();
    const impulse = new RAPIER.Vector3(
      deltaVel.x * mass,
      deltaVel.y * mass,
      deltaVel.z * mass
    );
    body.applyImpulse(impulse, true);
  } else if (type === BodyType.KinematicVelocityBased) {
    body.setLinvel(
      new RAPIER.Vector3(
        SetLinearVelocity.x[entity],
        SetLinearVelocity.y[entity],
        SetLinearVelocity.z[entity]
      ),
      true
    );
  }

  state.removeComponent(entity, SetLinearVelocity);
}

export function setAngularVelocityForEntity(
  entity: number,
  body: RAPIER.RigidBody,
  state: State
): void {
  const type = Body.type[entity];

  if (type === BodyType.Dynamic) {
    const currentAngVel = body.angvel();
    const targetAngVel = new RAPIER.Vector3(
      SetAngularVelocity.x[entity],
      SetAngularVelocity.y[entity],
      SetAngularVelocity.z[entity]
    );
    const deltaAngVel = new RAPIER.Vector3(
      targetAngVel.x - currentAngVel.x,
      targetAngVel.y - currentAngVel.y,
      targetAngVel.z - currentAngVel.z
    );
    const inertia = body.principalInertia();
    const impulse = new RAPIER.Vector3(
      deltaAngVel.x * inertia.x,
      deltaAngVel.y * inertia.y,
      deltaAngVel.z * inertia.z
    );
    body.applyTorqueImpulse(impulse, true);
  } else if (type === BodyType.KinematicVelocityBased) {
    const angVelX = SetAngularVelocity.x[entity];
    const angVelY = SetAngularVelocity.y[entity];
    const angVelZ = SetAngularVelocity.z[entity];

    body.setAngvel(new RAPIER.Vector3(angVelX, angVelY, angVelZ), true);

    if (!state.hasComponent(entity, KinematicAngularVelocity)) {
      state.addComponent(entity, KinematicAngularVelocity);
    }
    KinematicAngularVelocity.x[entity] = angVelX;
    KinematicAngularVelocity.y[entity] = angVelY;
    KinematicAngularVelocity.z[entity] = angVelZ;
  }

  state.removeComponent(entity, SetAngularVelocity);
}

export function applyKinematicMove(
  entity: number,
  body: RAPIER.RigidBody,
  state: State
): void {
  const type = Body.type[entity];
  if (type === BodyType.KinematicPositionBased) {
    body.setNextKinematicTranslation(
      new RAPIER.Vector3(
        KinematicMove.x[entity],
        KinematicMove.y[entity],
        KinematicMove.z[entity]
      )
    );
  } else if (type === BodyType.KinematicVelocityBased) {
    const currentPos = body.translation();
    const targetX = KinematicMove.x[entity];
    const targetY = KinematicMove.y[entity];
    const targetZ = KinematicMove.z[entity];
    const dt = TIME_CONSTANTS.FIXED_TIMESTEP;
    body.setLinvel(
      new RAPIER.Vector3(
        (targetX - currentPos.x) / dt,
        (targetY - currentPos.y) / dt,
        (targetZ - currentPos.z) / dt
      ),
      true
    );
  }
  state.removeComponent(entity, KinematicMove);
}

export function applyKinematicRotation(
  entity: number,
  body: RAPIER.RigidBody,
  state: State
): void {
  if (Body.type[entity] === BodyType.KinematicPositionBased) {
    body.setNextKinematicRotation(
      new RAPIER.Quaternion(
        KinematicRotate.x[entity],
        KinematicRotate.y[entity],
        KinematicRotate.z[entity],
        KinematicRotate.w[entity]
      )
    );
  }
  state.removeComponent(entity, KinematicRotate);
}

export function teleportEntity(entity: number, body: RAPIER.RigidBody): void {
  const currentPos = body.translation();
  const currentRot = body.rotation();

  const hasPositionChange =
    currentPos.x !== Body.posX[entity] ||
    currentPos.y !== Body.posY[entity] ||
    currentPos.z !== Body.posZ[entity];

  const hasRotationChange =
    currentRot.x !== Body.rotX[entity] ||
    currentRot.y !== Body.rotY[entity] ||
    currentRot.z !== Body.rotZ[entity] ||
    currentRot.w !== Body.rotW[entity];

  if (hasPositionChange) {
    body.setTranslation(
      new RAPIER.Vector3(
        Body.posX[entity],
        Body.posY[entity],
        Body.posZ[entity]
      ),
      true
    );

    if (InterpolatedTransform.prevPosX[entity] !== undefined) {
      InterpolatedTransform.prevPosX[entity] = Body.posX[entity];
      InterpolatedTransform.prevPosY[entity] = Body.posY[entity];
      InterpolatedTransform.prevPosZ[entity] = Body.posZ[entity];
      InterpolatedTransform.posX[entity] = Body.posX[entity];
      InterpolatedTransform.posY[entity] = Body.posY[entity];
      InterpolatedTransform.posZ[entity] = Body.posZ[entity];
    }
  }

  if (hasRotationChange) {
    body.setRotation(
      new RAPIER.Quaternion(
        Body.rotX[entity],
        Body.rotY[entity],
        Body.rotZ[entity],
        Body.rotW[entity]
      ),
      true
    );

    if (InterpolatedTransform.prevRotX[entity] !== undefined) {
      InterpolatedTransform.prevRotX[entity] = Body.rotX[entity];
      InterpolatedTransform.prevRotY[entity] = Body.rotY[entity];
      InterpolatedTransform.prevRotZ[entity] = Body.rotZ[entity];
      InterpolatedTransform.prevRotW[entity] = Body.rotW[entity];
      InterpolatedTransform.rotX[entity] = Body.rotX[entity];
      InterpolatedTransform.rotY[entity] = Body.rotY[entity];
      InterpolatedTransform.rotZ[entity] = Body.rotZ[entity];
      InterpolatedTransform.rotW[entity] = Body.rotW[entity];
    }
  }
}

export function detectPlatformContinuous(
  entity: number,
  collider: RAPIER.Collider,
  physicsWorld: RAPIER.World,
  colliderToEntity: Map<number, number>
): number {
  const castDistance = 0.15;
  const shapePos = collider.translation();
  const shapeRot = collider.rotation();
  const shapeVel = new RAPIER.Vector3(0, -1, 0);
  const colliderShape = collider.shape;

  const selfHandle = collider.handle;

  const hit = physicsWorld.castShape(
    shapePos,
    shapeRot,
    shapeVel,
    colliderShape,
    castDistance,
    castDistance,
    true,
    RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
    undefined,
    undefined,
    undefined,
    (otherCollider: RAPIER.Collider) => otherCollider.handle !== selfHandle
  );

  if (hit) {
    const platformColliderHandle = hit.collider.handle;
    const platformEntity = colliderToEntity.get(platformColliderHandle);

    if (platformEntity !== undefined && platformEntity !== entity) {
      const hitNormal = hit.normal1;
      if (hitNormal.y > 0.7) {
        return platformEntity;
      }
    }
  }

  return NULL_ENTITY;
}

export function applyCharacterMovement(
  entity: number,
  controller: RAPIER.KinematicCharacterController,
  collider: RAPIER.Collider,
  body: RAPIER.RigidBody,
  deltaTime: number,
  gravityY: number,
  colliderToEntity: Map<number, number>,
  physicsWorld: RAPIER.World
): void {
  const wasGrounded = CharacterController.grounded[entity] === 1;

  const gravityScale = Body.gravityScale[entity];
  const effectiveGravity = gravityY * gravityScale;

  if (!wasGrounded) {
    CharacterMovement.velocityY[entity] =
      (CharacterMovement.velocityY[entity] || 0) + effectiveGravity * deltaTime;
  } else if (CharacterMovement.velocityY[entity] < 0) {
    CharacterMovement.velocityY[entity] = 0;
  }

  const totalVelY =
    (CharacterMovement.velocityY[entity] || 0) +
    (CharacterMovement.desiredVelY[entity] || 0);

  let platformVelX = 0;
  let platformVelY = 0;
  let platformVelZ = 0;
  let tangentialVelX = 0;
  let tangentialVelY = 0;
  let tangentialVelZ = 0;

  const platform = CharacterController.platform[entity];
  if (wasGrounded && platform !== NULL_ENTITY) {
    const platformBodyType = Body.type[platform];
    if (platformBodyType === BodyType.KinematicVelocityBased) {
      platformVelX = Body.velX[platform] || 0;
      platformVelY = Body.velY[platform] || 0;
      platformVelZ = Body.velZ[platform] || 0;
    }

    const angVelX = Body.rotVelX[platform] || 0;
    const angVelY = Body.rotVelY[platform] || 0;
    const angVelZ = Body.rotVelZ[platform] || 0;

    if (angVelX !== 0 || angVelY !== 0 || angVelZ !== 0) {
      const playerPosX = Body.posX[entity];
      const playerPosY = Body.posY[entity];
      const playerPosZ = Body.posZ[entity];
      const platformPosX = Body.posX[platform];
      const platformPosY = Body.posY[platform];
      const platformPosZ = Body.posZ[platform];

      const offsetX = playerPosX - platformPosX;
      const offsetY = playerPosY - platformPosY;
      const offsetZ = playerPosZ - platformPosZ;

      tangentialVelX = angVelY * offsetZ - angVelZ * offsetY;
      tangentialVelY = angVelZ * offsetX - angVelX * offsetZ;
      tangentialVelZ = angVelX * offsetY - angVelY * offsetX;
    }
  }

  CharacterController.platformVelX[entity] = platformVelX + tangentialVelX;
  CharacterController.platformVelY[entity] = platformVelY + tangentialVelY;
  CharacterController.platformVelZ[entity] = platformVelZ + tangentialVelZ;

  const desiredTranslation = new RAPIER.Vector3(
    (CharacterMovement.desiredVelX[entity] + platformVelX + tangentialVelX) *
      deltaTime,
    (totalVelY + platformVelY + tangentialVelY) * deltaTime,
    (CharacterMovement.desiredVelZ[entity] + platformVelZ + tangentialVelZ) *
      deltaTime
  );

  const selfHandle = collider.handle;

  controller.computeColliderMovement(
    collider,
    desiredTranslation,
    RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
    undefined,
    (otherCollider: RAPIER.Collider) => otherCollider.handle !== selfHandle
  );

  const correctedMovement = controller.computedMovement();

  const desiredHorizontalSpeed = Math.sqrt(
    CharacterMovement.desiredVelX[entity] ** 2 +
      CharacterMovement.desiredVelZ[entity] ** 2
  );
  const actualHorizontalSpeed = Math.sqrt(
    (correctedMovement.x / deltaTime) ** 2 +
      (correctedMovement.z / deltaTime) ** 2
  );

  const isStuckAgainstWall =
    desiredHorizontalSpeed > 0.1 &&
    actualHorizontalSpeed < desiredHorizontalSpeed * 0.1;

  let finalMovement = correctedMovement;

  if (isStuckAgainstWall && CharacterMovement.velocityY[entity] > 0) {
    const pushOffX = -CharacterMovement.desiredVelX[entity] * 0.001;
    const pushOffZ = -CharacterMovement.desiredVelZ[entity] * 0.001;

    finalMovement = new RAPIER.Vector3(
      correctedMovement.x + pushOffX,
      correctedMovement.y,
      correctedMovement.z + pushOffZ
    );
  }

  const currentPos = body.translation();
  const newPos = new RAPIER.Vector3(
    currentPos.x + finalMovement.x,
    currentPos.y + finalMovement.y,
    currentPos.z + finalMovement.z
  );

  body.setNextKinematicTranslation(newPos);

  CharacterMovement.actualMoveX[entity] = finalMovement.x;
  CharacterMovement.actualMoveY[entity] = finalMovement.y;
  CharacterMovement.actualMoveZ[entity] = finalMovement.z;

  CharacterController.moveX[entity] = finalMovement.x;
  CharacterController.moveY[entity] = finalMovement.y;
  CharacterController.moveZ[entity] = finalMovement.z;

  const grounded = controller.computedGrounded() ? 1 : 0;
  CharacterController.grounded[entity] = grounded;
  Body.grounded[entity] = grounded;

  if (grounded) {
    CharacterController.platform[entity] = detectPlatformContinuous(
      entity,
      collider,
      physicsWorld,
      colliderToEntity
    );
  } else {
    CharacterController.platform[entity] = NULL_ENTITY;
  }

  if (grounded && !wasGrounded) {
    CharacterMovement.velocityY[entity] = 0;
  }
}

export function interpolateTransforms(state: State, alpha: number): void {
  for (const entity of interpolatedTransformQuery(state.world)) {
    if (!state.hasComponent(entity, Transform))
      throw new Error(
        `[interpolateTransforms] Entity ${entity} does not have the required components`
      );

    const prevPosX = InterpolatedTransform.prevPosX[entity];
    const prevPosZ = InterpolatedTransform.prevPosZ[entity];
    const currPosX = InterpolatedTransform.posX[entity];
    const currPosZ = InterpolatedTransform.posZ[entity];

    Transform.posX[entity] = prevPosX * (1 - alpha) + currPosX * alpha;
    Transform.posY[entity] =
      InterpolatedTransform.prevPosY[entity] * (1 - alpha) +
      InterpolatedTransform.posY[entity] * alpha;
    Transform.posZ[entity] = prevPosZ * (1 - alpha) + currPosZ * alpha;

    const prevW = InterpolatedTransform.prevRotW[entity];
    const prevX = InterpolatedTransform.prevRotX[entity];
    const prevY = InterpolatedTransform.prevRotY[entity];
    const prevZ = InterpolatedTransform.prevRotZ[entity];

    const currW = InterpolatedTransform.rotW[entity];
    const currX = InterpolatedTransform.rotX[entity];
    const currY = InterpolatedTransform.rotY[entity];
    const currZ = InterpolatedTransform.rotZ[entity];

    let dot = prevW * currW + prevX * currX + prevY * currY + prevZ * currZ;
    const invAlpha = 1 - alpha;

    if (dot < 0) {
      Transform.rotW[entity] = prevW * invAlpha - currW * alpha;
      Transform.rotX[entity] = prevX * invAlpha - currX * alpha;
      Transform.rotY[entity] = prevY * invAlpha - currY * alpha;
      Transform.rotZ[entity] = prevZ * invAlpha - currZ * alpha;
    } else {
      Transform.rotW[entity] = prevW * invAlpha + currW * alpha;
      Transform.rotX[entity] = prevX * invAlpha + currX * alpha;
      Transform.rotY[entity] = prevY * invAlpha + currY * alpha;
      Transform.rotZ[entity] = prevZ * invAlpha + currZ * alpha;
    }

    const norm = Math.sqrt(
      Transform.rotW[entity] * Transform.rotW[entity] +
        Transform.rotX[entity] * Transform.rotX[entity] +
        Transform.rotY[entity] * Transform.rotY[entity] +
        Transform.rotZ[entity] * Transform.rotZ[entity]
    );

    if (norm > 0.001) {
      Transform.rotW[entity] /= norm;
      Transform.rotX[entity] /= norm;
      Transform.rotY[entity] /= norm;
      Transform.rotZ[entity] /= norm;
    }

    syncEulerFromQuaternion(Transform, entity);
  }
}

export function syncRigidbodyToECS(
  entity: number,
  body: RAPIER.RigidBody,
  state: State
): void {
  const position = body.translation();
  const rotation = body.rotation();
  const linvel = body.linvel();

  Body.posX[entity] = position.x;
  Body.posY[entity] = position.y;
  Body.posZ[entity] = position.z;
  Body.rotX[entity] = rotation.x;
  Body.rotY[entity] = rotation.y;
  Body.rotZ[entity] = rotation.z;
  Body.rotW[entity] = rotation.w;

  const euler = quaternionToEuler(
    rotation.x,
    rotation.y,
    rotation.z,
    rotation.w
  );
  Body.eulerX[entity] = euler.x;
  Body.eulerY[entity] = euler.y;
  Body.eulerZ[entity] = euler.z;

  Body.velX[entity] = linvel.x;
  Body.velY[entity] = linvel.y;
  Body.velZ[entity] = linvel.z;

  if (state.hasComponent(entity, KinematicAngularVelocity)) {
    Body.rotVelX[entity] = KinematicAngularVelocity.x[entity];
    Body.rotVelY[entity] = KinematicAngularVelocity.y[entity];
    Body.rotVelZ[entity] = KinematicAngularVelocity.z[entity];
  } else {
    const angvel = body.angvel();
    Body.rotVelX[entity] = angvel.x;
    Body.rotVelY[entity] = angvel.y;
    Body.rotVelZ[entity] = angvel.z;
  }
}

export function copyRigidbodyToTransforms(entity: number, state: State): void {
  if (
    !state.hasComponent(entity, Transform) ||
    !state.hasComponent(entity, WorldTransform) ||
    !state.hasComponent(entity, InterpolatedTransform)
  )
    throw new Error(
      `[copyRigidbodyToTransforms] Entity ${entity} does not have the required components`
    );

  Transform.posX[entity] = Body.posX[entity];
  Transform.posY[entity] = Body.posY[entity];
  Transform.posZ[entity] = Body.posZ[entity];
  Transform.rotX[entity] = Body.rotX[entity];
  Transform.rotY[entity] = Body.rotY[entity];
  Transform.rotZ[entity] = Body.rotZ[entity];
  Transform.rotW[entity] = Body.rotW[entity];
  Transform.eulerX[entity] = Body.eulerX[entity];
  Transform.eulerY[entity] = Body.eulerY[entity];
  Transform.eulerZ[entity] = Body.eulerZ[entity];

  WorldTransform.posX[entity] = Body.posX[entity];
  WorldTransform.posY[entity] = Body.posY[entity];
  WorldTransform.posZ[entity] = Body.posZ[entity];
  WorldTransform.rotX[entity] = Body.rotX[entity];
  WorldTransform.rotY[entity] = Body.rotY[entity];
  WorldTransform.rotZ[entity] = Body.rotZ[entity];
  WorldTransform.rotW[entity] = Body.rotW[entity];
  WorldTransform.eulerX[entity] = Body.eulerX[entity];
  WorldTransform.eulerY[entity] = Body.eulerY[entity];
  WorldTransform.eulerZ[entity] = Body.eulerZ[entity];

  InterpolatedTransform.prevPosX[entity] = InterpolatedTransform.posX[entity];
  InterpolatedTransform.prevPosY[entity] = InterpolatedTransform.posY[entity];
  InterpolatedTransform.prevPosZ[entity] = InterpolatedTransform.posZ[entity];
  InterpolatedTransform.prevRotX[entity] = InterpolatedTransform.rotX[entity];
  InterpolatedTransform.prevRotY[entity] = InterpolatedTransform.rotY[entity];
  InterpolatedTransform.prevRotZ[entity] = InterpolatedTransform.rotZ[entity];
  InterpolatedTransform.prevRotW[entity] = InterpolatedTransform.rotW[entity];

  InterpolatedTransform.posX[entity] = Body.posX[entity];
  InterpolatedTransform.posY[entity] = Body.posY[entity];
  InterpolatedTransform.posZ[entity] = Body.posZ[entity];
  InterpolatedTransform.rotX[entity] = Body.rotX[entity];
  InterpolatedTransform.rotY[entity] = Body.rotY[entity];
  InterpolatedTransform.rotZ[entity] = Body.rotZ[entity];
  InterpolatedTransform.rotW[entity] = Body.rotW[entity];
}

export function syncBodyQuaternionFromEuler(entity: number): void {
  const quat = eulerToQuaternion(
    Body.eulerX[entity],
    Body.eulerY[entity],
    Body.eulerZ[entity]
  );
  Body.rotX[entity] = quat.x;
  Body.rotY[entity] = quat.y;
  Body.rotZ[entity] = quat.z;
  Body.rotW[entity] = quat.w;
}

export function syncBodyEulerFromQuaternion(entity: number): void {
  const euler = quaternionToEuler(
    Body.rotX[entity],
    Body.rotY[entity],
    Body.rotZ[entity],
    Body.rotW[entity]
  );
  Body.eulerX[entity] = euler.x;
  Body.eulerY[entity] = euler.y;
  Body.eulerZ[entity] = euler.z;
}
