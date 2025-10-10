import * as RAPIER from '@dimforge/rapier3d-compat';
import { ActiveEvents } from '@dimforge/rapier3d-compat';
import type { State, System } from '../../core';
import { defineQuery, NULL_ENTITY, TIME_CONSTANTS } from '../../core';
import { Transform, WorldTransform } from '../transforms';
import {
  ApplyAngularImpulse,
  ApplyForce,
  ApplyImpulse,
  ApplyTorque,
  Body,
  CharacterController,
  CharacterMovement,
  Collider,
  CollisionEvents,
  InterpolatedTransform,
  KinematicMove,
  KinematicRotate,
  PhysicsWorld,
  SetAngularVelocity,
  SetLinearVelocity,
  TouchedEvent,
  TouchEndedEvent,
} from './components';
import {
  applyAngularImpulseToEntity,
  applyCharacterMovement,
  applyForceToEntity,
  applyImpulseToEntity,
  applyKinematicMove,
  applyKinematicRotation,
  applyTorqueToEntity,
  configureRigidbody,
  copyRigidbodyToTransforms,
  createColliderDescriptor,
  createRigidbodyDescriptor,
  DEFAULT_GRAVITY,
  interpolateTransforms,
  setAngularVelocityForEntity,
  setLinearVelocityForEntity,
  syncBodyQuaternionFromEuler,
  syncRigidbodyToECS,
  teleportEntity,
} from './utils';

interface PhysicsContext {
  physicsWorld: RAPIER.World | null;
  worldEntity: number | null;
  entityToRigidbody: Map<number, RAPIER.RigidBody>;
  entityToCollider: Map<number, RAPIER.Collider>;
  entityToCharacterController: Map<number, RAPIER.KinematicCharacterController>;
  colliderToEntity: Map<number, number>;
}

const physicsWorldQuery = defineQuery([PhysicsWorld]);
const bodyQuery = defineQuery([Body]);
const colliderQuery = defineQuery([Collider]);
const characterControllerQuery = defineQuery([CharacterController]);
const characterMovementQuery = defineQuery([
  CharacterController,
  CharacterMovement,
  Body,
  Transform,
]);
const applyForceQuery = defineQuery([ApplyForce, Body]);
const applyTorqueQuery = defineQuery([ApplyTorque, Body]);
const applyImpulseQuery = defineQuery([ApplyImpulse, Body]);
const applyAngularImpulseQuery = defineQuery([ApplyAngularImpulse, Body]);
const setLinearVelocityQuery = defineQuery([SetLinearVelocity, Body]);
const setAngularVelocityQuery = defineQuery([SetAngularVelocity, Body]);
const kinematicMoveQuery = defineQuery([KinematicMove, Body]);
const kinematicRotateQuery = defineQuery([KinematicRotate, Body]);
const touchedEventQuery = defineQuery([TouchedEvent]);
const touchEndedEventQuery = defineQuery([TouchEndedEvent]);

const stateToPhysicsContext = new WeakMap<State, PhysicsContext>();

function getPhysicsContext(state: State): PhysicsContext {
  let context = stateToPhysicsContext.get(state);
  if (!context) {
    context = {
      physicsWorld: null,
      worldEntity: null,
      entityToRigidbody: new Map(),
      entityToCollider: new Map(),
      entityToCharacterController: new Map(),
      colliderToEntity: new Map(),
    };
    stateToPhysicsContext.set(state, context);
  }
  return context;
}

function removeColliderForEntity(
  state: State,
  context: PhysicsContext,
  entity: number,
  collider: RAPIER.Collider,
  worldRapier: RAPIER.World
): void {
  clearControllersReferencingEntity(state, context, entity);

  if (state.hasComponent(entity, CharacterController)) {
    resetCharacterControllerForEntity(state, entity, context);
  }

  try {
    const existing = worldRapier.getCollider(collider.handle);
    if (existing) {
      worldRapier.removeCollider(existing, false);
    }
  } catch (error) {
    console.warn(
      `[Physics] Failed to remove collider for entity ${entity}:`,
      error
    );
  }

  context.entityToCollider.delete(entity);
  context.colliderToEntity.delete(collider.handle);
}

function removeRigidBodyForEntity(
  state: State,
  context: PhysicsContext,
  entity: number,
  body: RAPIER.RigidBody,
  worldRapier: RAPIER.World
): void {
  clearControllersReferencingEntity(state, context, entity);

  try {
    const existing = worldRapier.getRigidBody(body.handle);
    if (existing) {
      worldRapier.removeRigidBody(existing);
    }
  } catch (error) {
    console.warn(`[Physics] Failed to remove rigidbody for entity ${entity}:`, error);
  }

  context.entityToRigidbody.delete(entity);
}

function isRecoverableRapierError(error: unknown): boolean {
  if (!error) return false;
  let message: string | undefined;

  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof (error as { message?: unknown }).message === 'string') {
    message = (error as { message: string }).message;
  }

  if (!message) return false;

  return (
    message.includes('recursive use of an object') ||
    message.includes('unreachable')
  );
}

let rapierEngineInitialized = false;
let rapierInitPromise: Promise<void> | null = null;

export async function initializePhysics(): Promise<void> {
  if (rapierEngineInitialized) {
    return;
  }

  if (!rapierInitPromise) {
    rapierInitPromise = RAPIER.init()
      .then(() => {
        rapierEngineInitialized = true;
      })
      .catch((error) => {
        rapierInitPromise = null;
        throw error;
      });
  }

  await rapierInitPromise;
}

function ensureRapierReady(): boolean {
  if (rapierEngineInitialized) {
    return true;
  }

  if (!rapierInitPromise) {
    void initializePhysics();
  }

  return false;
}

export const PhysicsWorldSystem: System = {
  group: 'fixed',
  first: true,
  update: (state) => {
    const context = getPhysicsContext(state);

    if (context.physicsWorld) return;
    if (!ensureRapierReady()) return;

    const worldEntities = physicsWorldQuery(state.world);
    if (worldEntities.length === 0) {
      const worldEntity = state.createEntity();
      state.addComponent(worldEntity, PhysicsWorld);
      context.worldEntity = worldEntity;

      PhysicsWorld.gravityX[worldEntity] = 0;
      PhysicsWorld.gravityY[worldEntity] = DEFAULT_GRAVITY;
      PhysicsWorld.gravityZ[worldEntity] = 0;

      const worldRapier = new RAPIER.World(
        new RAPIER.Vector3(
          PhysicsWorld.gravityX[worldEntity],
          PhysicsWorld.gravityY[worldEntity],
          PhysicsWorld.gravityZ[worldEntity]
        )
      );
      worldRapier.timestep = TIME_CONSTANTS.FIXED_TIMESTEP;
      context.physicsWorld = worldRapier;
    }
  },
  dispose: (state) => {
    const context = stateToPhysicsContext.get(state);
    if (context) {
      if (context.physicsWorld) {
        context.physicsWorld.free();
        context.physicsWorld = null;
      }
      context.worldEntity = null;
      context.entityToRigidbody.clear();
      context.entityToCollider.clear();
      context.entityToCharacterController.clear();
      context.colliderToEntity.clear();
      stateToPhysicsContext.delete(state);
    }
  },
};

export const PhysicsInitializationSystem: System = {
  group: 'fixed',
  after: [PhysicsWorldSystem],
  update: (state) => {
    const context = getPhysicsContext(state);
    if (!ensureRapierReady()) return;
    const worldRapier = context.physicsWorld;
    if (!worldRapier) return;

    for (const entity of bodyQuery(state.world)) {
      if (!context.entityToRigidbody.has(entity)) {
        createRigidbodyForEntity(entity, worldRapier, state, context);
      }
    }

    for (const entity of colliderQuery(state.world)) {
      if (!context.entityToCollider.has(entity)) {
        createColliderForEntity(entity, worldRapier, state, context);
      }
    }

    for (const entity of characterControllerQuery(state.world)) {
      if (!context.entityToCharacterController.has(entity)) {
        createCharacterControllerForEntity(entity, worldRapier, context);
      }
    }
  },
};

function createRigidbodyForEntity(
  entity: number,
  worldRapier: RAPIER.World,
  state: State,
  context: PhysicsContext
): void {
  const position = new RAPIER.Vector3(
    Body.posX[entity],
    Body.posY[entity],
    Body.posZ[entity]
  );

  const hasEuler =
    Body.eulerX[entity] !== 0 ||
    Body.eulerY[entity] !== 0 ||
    Body.eulerZ[entity] !== 0;
  if (hasEuler) {
    syncBodyQuaternionFromEuler(entity);
  }

  const rotX = Body.rotX[entity];
  const rotY = Body.rotY[entity];
  const rotZ = Body.rotZ[entity];
  const rotW = Body.rotW[entity];
  const magnitude = Math.sqrt(
    rotX * rotX + rotY * rotY + rotZ * rotZ + rotW * rotW
  );

  if (magnitude < 0.001) {
    throw new Error(
      `Invalid quaternion for Rigidbody entity ${entity}: (${rotX}, ${rotY}, ${rotZ}, ${rotW}). ` +
        `Quaternion magnitude is ${magnitude}. ` +
        `Ensure Rigidbody.rotW is initialized (typically to 1 for identity rotation).`
    );
  }

  const rotation = new RAPIER.Quaternion(rotX, rotY, rotZ, rotW);
  const descriptor = createRigidbodyDescriptor(
    Body.type[entity],
    position,
    rotation
  );

  const body = worldRapier.createRigidBody(descriptor);

  configureRigidbody(
    body,
    entity,
    Body.type[entity],
    Body.mass[entity],
    new RAPIER.Vector3(Body.velX[entity], Body.velY[entity], Body.velZ[entity]),
    new RAPIER.Vector3(
      Body.rotVelX[entity],
      Body.rotVelY[entity],
      Body.rotVelZ[entity]
    ),
    Body.linearDamping[entity],
    Body.angularDamping[entity],
    Body.gravityScale[entity],
    Body.ccd[entity],
    Body.lockRotX[entity],
    Body.lockRotY[entity],
    Body.lockRotZ[entity]
  );

  context.entityToRigidbody.set(entity, body);

  if (!state.hasComponent(entity, Transform)) {
    state.addComponent(entity, Transform);
    Transform.posX[entity] = Body.posX[entity];
    Transform.posY[entity] = Body.posY[entity];
    Transform.posZ[entity] = Body.posZ[entity];
    Transform.rotX[entity] = Body.rotX[entity];
    Transform.rotY[entity] = Body.rotY[entity];
    Transform.rotZ[entity] = Body.rotZ[entity];
    Transform.rotW[entity] = Body.rotW[entity];
    Transform.scaleX[entity] = 1;
    Transform.scaleY[entity] = 1;
    Transform.scaleZ[entity] = 1;
  }

  if (!state.hasComponent(entity, WorldTransform)) {
    state.addComponent(entity, WorldTransform);
    WorldTransform.posX[entity] = Body.posX[entity];
    WorldTransform.posY[entity] = Body.posY[entity];
    WorldTransform.posZ[entity] = Body.posZ[entity];
    WorldTransform.rotX[entity] = Body.rotX[entity];
    WorldTransform.rotY[entity] = Body.rotY[entity];
    WorldTransform.rotZ[entity] = Body.rotZ[entity];
    WorldTransform.rotW[entity] = Body.rotW[entity];
    WorldTransform.scaleX[entity] = 1;
    WorldTransform.scaleY[entity] = 1;
    WorldTransform.scaleZ[entity] = 1;
  }

  if (!state.hasComponent(entity, InterpolatedTransform)) {
    state.addComponent(entity, InterpolatedTransform);
  }

  const pos = body.translation();
  const rot = body.rotation();

  InterpolatedTransform.prevPosX[entity] = pos.x;
  InterpolatedTransform.prevPosY[entity] = pos.y;
  InterpolatedTransform.prevPosZ[entity] = pos.z;
  InterpolatedTransform.posX[entity] = pos.x;
  InterpolatedTransform.posY[entity] = pos.y;
  InterpolatedTransform.posZ[entity] = pos.z;

  InterpolatedTransform.prevRotX[entity] = rot.x;
  InterpolatedTransform.prevRotY[entity] = rot.y;
  InterpolatedTransform.prevRotZ[entity] = rot.z;
  InterpolatedTransform.prevRotW[entity] = rot.w;
  InterpolatedTransform.rotX[entity] = rot.x;
  InterpolatedTransform.rotY[entity] = rot.y;
  InterpolatedTransform.rotZ[entity] = rot.z;
  InterpolatedTransform.rotW[entity] = rot.w;
}

function createColliderForEntity(
  entity: number,
  worldRapier: RAPIER.World,
  state: State,
  context: PhysicsContext
): void {
  const body = context.entityToRigidbody.get(entity);
  if (!body || !state.hasComponent(entity, Body)) {
    return;
  }

  const activeEvents = state.hasComponent(entity, CollisionEvents)
    ? ActiveEvents.COLLISION_EVENTS
    : ActiveEvents.NONE;

  const offset = new RAPIER.Vector3(
    Collider.posOffsetX[entity],
    Collider.posOffsetY[entity],
    Collider.posOffsetZ[entity]
  );

  const rotOffsetX = Collider.rotOffsetX[entity] || 0;
  const rotOffsetY = Collider.rotOffsetY[entity] || 0;
  const rotOffsetZ = Collider.rotOffsetZ[entity] || 0;
  let rotOffsetW = Collider.rotOffsetW[entity];

  const magnitude = Math.sqrt(
    rotOffsetX * rotOffsetX +
      rotOffsetY * rotOffsetY +
      rotOffsetZ * rotOffsetZ +
      rotOffsetW * rotOffsetW
  );

  if (magnitude < 0.001) {
    rotOffsetW = 1;
  }

  const rotationOffset = new RAPIER.Quaternion(
    rotOffsetX,
    rotOffsetY,
    rotOffsetZ,
    rotOffsetW
  );

  let scaleX = 1;
  let scaleY = 1;
  let scaleZ = 1;
  if (state.hasComponent(entity, Transform)) {
    scaleX = Transform.scaleX[entity];
    scaleY = Transform.scaleY[entity];
    scaleZ = Transform.scaleZ[entity];
  }

  const descriptor = createColliderDescriptor(
    Collider.shape[entity],
    Collider.sizeX[entity] * scaleX,
    Collider.sizeY[entity] * scaleY,
    Collider.sizeZ[entity] * scaleZ,
    Collider.radius[entity],
    Collider.height[entity],
    Collider.friction[entity],
    Collider.restitution[entity],
    Collider.density[entity],
    Collider.isSensor[entity],
    Collider.membershipGroups[entity],
    Collider.filterGroups[entity],
    offset,
    rotationOffset,
    activeEvents
  );

  const collider = worldRapier.createCollider(descriptor, body);

  context.entityToCollider.set(entity, collider);
  context.colliderToEntity.set(collider.handle, entity);
}

function configureCharacterControllerFromComponents(
  entity: number,
  controller: RAPIER.KinematicCharacterController
): void {
  controller.setMaxSlopeClimbAngle(CharacterController.maxSlope[entity]);
  controller.setMinSlopeSlideAngle(CharacterController.maxSlide[entity]);
  controller.setNormalNudgeFactor(0.0001);

  if (CharacterController.snapDist[entity] > 0) {
    controller.enableSnapToGround(CharacterController.snapDist[entity]);
  } else {
    controller.disableSnapToGround();
  }

  controller.enableAutostep(
    CharacterController.maxStepHeight[entity],
    CharacterController.minStepWidth[entity],
    !!CharacterController.autoStep[entity]
  );

  controller.setUp(
    new RAPIER.Vector3(
      CharacterController.upX[entity],
      CharacterController.upY[entity],
      CharacterController.upZ[entity]
    )
  );

  controller.setApplyImpulsesToDynamicBodies(true);
  controller.setCharacterMass(70);
  controller.setSlideEnabled(true);
}

function createCharacterControllerForEntity(
  entity: number,
  worldRapier: RAPIER.World,
  context: PhysicsContext
): void {
  const controller = worldRapier.createCharacterController(
    CharacterController.offset[entity]
  );
  configureCharacterControllerFromComponents(entity, controller);
  context.entityToCharacterController.set(entity, controller);

  CharacterController.grounded[entity] = 0;
  CharacterController.platform[entity] = NULL_ENTITY;
  CharacterController.platformVelX[entity] = 0;
  CharacterController.platformVelY[entity] = 0;
  CharacterController.platformVelZ[entity] = 0;
  CharacterController.moveX[entity] = 0;
  CharacterController.moveY[entity] = 0;
  CharacterController.moveZ[entity] = 0;
}

function resetCharacterControllerForEntity(
  state: State,
  entity: number,
  context: PhysicsContext
): void {
  if (!state.hasComponent(entity, CharacterController)) return;
  const worldRapier = context.physicsWorld;
  if (!worldRapier) return;

  const existing = context.entityToCharacterController.get(entity);
  if (existing) {
    worldRapier.removeCharacterController(existing);
  }

  const controller = worldRapier.createCharacterController(
    CharacterController.offset[entity]
  );
  configureCharacterControllerFromComponents(entity, controller);
  context.entityToCharacterController.set(entity, controller);

  CharacterController.grounded[entity] = 0;
  CharacterController.platform[entity] = NULL_ENTITY;
  CharacterController.platformVelX[entity] = 0;
  CharacterController.platformVelY[entity] = 0;
  CharacterController.platformVelZ[entity] = 0;
  CharacterController.moveX[entity] = 0;
  CharacterController.moveY[entity] = 0;
  CharacterController.moveZ[entity] = 0;

  if (state.hasComponent(entity, CharacterMovement)) {
    if (CharacterMovement.velocityY[entity] > 0) {
      CharacterMovement.velocityY[entity] = 0;
    }
    CharacterMovement.actualMoveX[entity] = 0;
    CharacterMovement.actualMoveY[entity] = 0;
    CharacterMovement.actualMoveZ[entity] = 0;
  }
}

function clearControllersReferencingEntity(
  state: State,
  context: PhysicsContext,
  platformEntity: number
): void {
  const controllers = characterControllerQuery(state.world);
  for (let i = 0; i < controllers.length; i++) {
    const controllerEntity = controllers[i];
    if (
      CharacterController.platform[controllerEntity] === platformEntity &&
      state.hasComponent(controllerEntity, CharacterController)
    ) {
      resetCharacterControllerForEntity(state, controllerEntity, context);
    }
  }
}

export const PhysicsCleanupSystem: System = {
  group: 'fixed',
  after: [PhysicsInitializationSystem],
  update: (state) => {
    const context = getPhysicsContext(state);
    if (!ensureRapierReady()) return;
    const worldRapier = context.physicsWorld;
    if (!worldRapier) return;

    const collidersNeedingRebuild = new Set<number>();
    const bodiesNeedingRebuild = new Set<number>();

    for (const [entity, collider] of context.entityToCollider) {
      const entityExists = state.exists(entity);
      const hasColliderComponent =
        entityExists && state.hasComponent(entity, Collider);

      if (!entityExists || !hasColliderComponent) {
        removeColliderForEntity(state, context, entity, collider, worldRapier);
        continue;
      }

      const currentMapping = context.colliderToEntity.get(collider.handle);
      if (currentMapping === undefined) {
        context.colliderToEntity.set(collider.handle, entity);
      } else if (currentMapping !== entity) {
        console.warn(
          `[Physics] Collider handle ${collider.handle} mismatch for entity ${entity}; expected ${entity}, got ${currentMapping}. Resetting collider.`
        );
        context.colliderToEntity.delete(collider.handle);
        context.entityToCollider.delete(entity);
        collidersNeedingRebuild.add(entity);
        continue;
      }

      const worldCollider = worldRapier.getCollider(collider.handle);
      if (!worldCollider) {
        console.warn(
          `[Physics] Collider handle ${collider.handle} for entity ${entity} is stale; scheduling rebuild.`
        );
        context.entityToCollider.delete(entity);
        context.colliderToEntity.delete(collider.handle);
        collidersNeedingRebuild.add(entity);
      }
    }

    for (const [entity, body] of context.entityToRigidbody) {
      const entityExists = state.exists(entity);
      const hasBodyComponent = entityExists && state.hasComponent(entity, Body);

      if (!entityExists || !hasBodyComponent) {
        removeRigidBodyForEntity(state, context, entity, body, worldRapier);
        const collider = context.entityToCollider.get(entity);
        if (collider) {
          removeColliderForEntity(state, context, entity, collider, worldRapier);
        }
        continue;
      }

      const worldBody = worldRapier.getRigidBody(body.handle);
      if (!worldBody) {
        console.warn(
          `[Physics] Rigidbody handle ${body.handle} for entity ${entity} is stale; scheduling rebuild.`
        );
        context.entityToRigidbody.delete(entity);
        bodiesNeedingRebuild.add(entity);

        const collider = context.entityToCollider.get(entity);
        if (collider) {
          context.entityToCollider.delete(entity);
          context.colliderToEntity.delete(collider.handle);
          collidersNeedingRebuild.add(entity);
        }
      }
    }

    for (const [entity, controller] of context.entityToCharacterController) {
      if (!state.exists(entity) || !state.hasComponent(entity, CharacterController)) {
        try {
          worldRapier.removeCharacterController(controller);
        } catch (error) {
          console.warn(
            `[Physics] Failed to remove character controller for entity ${entity}:`,
            error
          );
        }
        context.entityToCharacterController.delete(entity);
      }
    }

    for (const entity of bodiesNeedingRebuild) {
      if (!state.hasComponent(entity, Body)) continue;
      if (context.entityToRigidbody.has(entity)) continue;

      try {
        createRigidbodyForEntity(entity, worldRapier, state, context);
      } catch (error) {
        console.warn(
          `[Physics] Failed to recreate rigidbody for entity ${entity}:`,
          error
        );
      }
    }

    for (const entity of collidersNeedingRebuild) {
      if (!state.hasComponent(entity, Collider)) continue;
      if (!context.entityToRigidbody.has(entity)) continue;
      if (context.entityToCollider.has(entity)) continue;

      try {
        createColliderForEntity(entity, worldRapier, state, context);
      } catch (error) {
        console.warn(
          `[Physics] Failed to recreate collider for entity ${entity}:`,
          error
        );
      }
    }
  },
};

export const CharacterMovementSystem: System = {
  group: 'fixed',
  after: [PhysicsCleanupSystem],
  update: (state) => {
    const context = getPhysicsContext(state);
    if (!ensureRapierReady()) return;
    const worldRapier = context.physicsWorld;
    if (!worldRapier || context.worldEntity === null) return;

    const gravityY = PhysicsWorld.gravityY[context.worldEntity];

    const entities = characterMovementQuery(state.world);

    for (const entity of entities) {
      const controller = context.entityToCharacterController.get(entity);
      const collider = context.entityToCollider.get(entity);
      const rigidbody = context.entityToRigidbody.get(entity);

      if (!controller || !collider || !rigidbody) continue;

      if (!worldRapier.getCollider(collider.handle)) {
        removeColliderForEntity(state, context, entity, collider, worldRapier);
        continue;
      }

      if (!worldRapier.getRigidBody(rigidbody.handle)) {
        removeRigidBodyForEntity(state, context, entity, rigidbody, worldRapier);
        const staleCollider = context.entityToCollider.get(entity);
        if (staleCollider) {
          removeColliderForEntity(
            state,
            context,
            entity,
            staleCollider,
            worldRapier
          );
        }
        continue;
      }

      try {
        applyCharacterMovement(
          entity,
          controller,
          collider,
          rigidbody,
          state.time.fixedDeltaTime,
          gravityY,
          context.colliderToEntity,
          worldRapier
        );
      } catch (error) {
        if (isRecoverableRapierError(error)) {
          console.warn(
            `[Physics] Character movement failed for entity ${entity}; resetting physics state.`,
            error
          );

          const trackedCollider = context.entityToCollider.get(entity);
          if (trackedCollider) {
            removeColliderForEntity(
              state,
              context,
              entity,
              trackedCollider,
              worldRapier
            );
          }

          const trackedBody = context.entityToRigidbody.get(entity);
          if (trackedBody) {
            removeRigidBodyForEntity(
              state,
              context,
              entity,
              trackedBody,
              worldRapier
            );
          }

          continue;
        }

        throw error;
      }
    }
  },
};

export const ApplyForcesSystem: System = {
  group: 'fixed',
  after: [CharacterMovementSystem],
  update: (state) => {
    const context = getPhysicsContext(state);
    for (const entity of applyForceQuery(state.world)) {
      const body = context.entityToRigidbody.get(entity);
      if (body) {
        applyForceToEntity(entity, body, state);
      }
    }
  },
};

export const ApplyTorquesSystem: System = {
  group: 'fixed',
  after: [CharacterMovementSystem],
  update: (state) => {
    const context = getPhysicsContext(state);
    for (const entity of applyTorqueQuery(state.world)) {
      const body = context.entityToRigidbody.get(entity);
      if (body) {
        applyTorqueToEntity(entity, body, state);
      }
    }
  },
};

export const ApplyImpulsesSystem: System = {
  group: 'fixed',
  after: [ApplyForcesSystem, ApplyTorquesSystem],
  update: (state) => {
    const context = getPhysicsContext(state);
    for (const entity of applyImpulseQuery(state.world)) {
      const body = context.entityToRigidbody.get(entity);
      if (body) {
        applyImpulseToEntity(entity, body, state);
      }
    }
  },
};

export const ApplyAngularImpulsesSystem: System = {
  group: 'fixed',
  after: [ApplyForcesSystem, ApplyTorquesSystem],
  update: (state) => {
    const context = getPhysicsContext(state);
    for (const entity of applyAngularImpulseQuery(state.world)) {
      const body = context.entityToRigidbody.get(entity);
      if (body) {
        applyAngularImpulseToEntity(entity, body, state);
      }
    }
  },
};

export const SetVelocitySystem: System = {
  group: 'fixed',
  after: [ApplyImpulsesSystem, ApplyAngularImpulsesSystem],
  update: (state) => {
    const context = getPhysicsContext(state);

    for (const entity of setLinearVelocityQuery(state.world)) {
      const body = context.entityToRigidbody.get(entity);
      if (body) {
        setLinearVelocityForEntity(entity, body, state);
      }
    }

    for (const entity of setAngularVelocityQuery(state.world)) {
      const body = context.entityToRigidbody.get(entity);
      if (body) {
        setAngularVelocityForEntity(entity, body, state);
      }
    }
  },
};

export const KinematicMovementSystem: System = {
  group: 'fixed',
  after: [SetVelocitySystem],
  update: (state) => {
    const context = getPhysicsContext(state);

    for (const entity of kinematicMoveQuery(state.world)) {
      const body = context.entityToRigidbody.get(entity);
      if (body) {
        applyKinematicMove(entity, body, state);
      }
    }

    for (const entity of kinematicRotateQuery(state.world)) {
      const body = context.entityToRigidbody.get(entity);
      if (body) {
        applyKinematicRotation(entity, body, state);
      }
    }
  },
};

export const TeleportationSystem: System = {
  group: 'fixed',
  after: [KinematicMovementSystem],
  update: (state) => {
    const context = getPhysicsContext(state);

    for (const entity of bodyQuery(state.world)) {
      const body = context.entityToRigidbody.get(entity);
      if (!body) continue;

      teleportEntity(entity, body);
    }
  },
};

export const PhysicsStepSystem: System = {
  group: 'fixed',
  after: [TeleportationSystem],
  update: (state) => {
    const context = getPhysicsContext(state);
    if (!ensureRapierReady()) return;
    const worldRapier = context.physicsWorld;
    if (!worldRapier) return;

    const eventQueue = new RAPIER.EventQueue(true);
    worldRapier.step(eventQueue);
    processCollisionEvents(eventQueue, state, context);
    eventQueue.free();
  },
};

function processCollisionEvents(
  eventQueue: RAPIER.EventQueue,
  state: State,
  context: PhysicsContext
): void {
  eventQueue.drainCollisionEvents(
    (handle1: number, handle2: number, started: boolean) => {
      const entity1 = context.colliderToEntity.get(handle1);
      const entity2 = context.colliderToEntity.get(handle2);

      if (entity1 === undefined || entity2 === undefined) return;

      if (started) {
        if (state.hasComponent(entity1, CollisionEvents)) {
          state.addComponent(entity1, TouchedEvent);
          TouchedEvent.other[entity1] = entity2;
          TouchedEvent.handle1[entity1] = handle1;
          TouchedEvent.handle2[entity1] = handle2;
        }

        if (state.hasComponent(entity2, CollisionEvents)) {
          state.addComponent(entity2, TouchedEvent);
          TouchedEvent.other[entity2] = entity1;
          TouchedEvent.handle1[entity2] = handle2;
          TouchedEvent.handle2[entity2] = handle1;
        }
      } else {
        if (state.hasComponent(entity1, CollisionEvents)) {
          state.addComponent(entity1, TouchEndedEvent);
          TouchEndedEvent.other[entity1] = entity2;
          TouchEndedEvent.handle1[entity1] = handle1;
          TouchEndedEvent.handle2[entity1] = handle2;
        }

        if (state.hasComponent(entity2, CollisionEvents)) {
          state.addComponent(entity2, TouchEndedEvent);
          TouchEndedEvent.other[entity2] = entity1;
          TouchEndedEvent.handle1[entity2] = handle2;
          TouchEndedEvent.handle2[entity2] = handle1;
        }
      }
    }
  );
}

export const CollisionEventCleanupSystem: System = {
  group: 'setup',
  update: (state) => {
    for (const entity of touchedEventQuery(state.world)) {
      state.removeComponent(entity, TouchedEvent);
    }

    for (const entity of touchEndedEventQuery(state.world)) {
      state.removeComponent(entity, TouchEndedEvent);
    }
  },
};

export const PhysicsRapierSyncSystem: System = {
  group: 'fixed',
  after: [PhysicsStepSystem],
  update: (state) => {
    const context = getPhysicsContext(state);
    if (!ensureRapierReady()) return;

    for (const [entity, body] of context.entityToRigidbody) {
      if (state.hasComponent(entity, Body)) {
        syncRigidbodyToECS(entity, body, state);
        copyRigidbodyToTransforms(entity, state);
      }
    }
  },
};

export const PhysicsInterpolationSystem: System = {
  group: 'simulation',
  first: true,
  update: (state) => {
    const alpha =
      state.scheduler.getAccumulator() / TIME_CONSTANTS.FIXED_TIMESTEP;
    interpolateTransforms(state, alpha);
  },
};
