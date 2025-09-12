import * as RAPIER from '@dimforge/rapier3d-compat';
import { ActiveEvents } from '@dimforge/rapier3d-compat';
import type { State, System } from '../../core';
import { defineQuery, TIME_CONSTANTS } from '../../core';
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

// Query definitions
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

let rapierEngineInitialized = false;

export async function initializePhysics(): Promise<void> {
  if (!rapierEngineInitialized) {
    await RAPIER.init();
    rapierEngineInitialized = true;
  }
}

export const PhysicsWorldSystem: System = {
  group: 'fixed',
  first: true,
  update: (state) => {
    const context = getPhysicsContext(state);
    if (context.physicsWorld) return;

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
      }
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

  const descriptor = createColliderDescriptor(
    Collider.shape[entity],
    Collider.sizeX[entity],
    Collider.sizeY[entity],
    Collider.sizeZ[entity],
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

function createCharacterControllerForEntity(
  entity: number,
  worldRapier: RAPIER.World,
  context: PhysicsContext
): void {
  const controller = worldRapier.createCharacterController(
    CharacterController.offset[entity]
  );
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
  context.entityToCharacterController.set(entity, controller);
}

export const PhysicsCleanupSystem: System = {
  group: 'fixed',
  after: [PhysicsInitializationSystem],
  update: (state) => {
    const context = getPhysicsContext(state);
    const worldRapier = context.physicsWorld;
    if (!worldRapier) return;

    for (const [entity, collider] of context.entityToCollider) {
      if (!state.hasComponent(entity, Collider)) {
        worldRapier.removeCollider(collider, false);
        context.entityToCollider.delete(entity);
        context.colliderToEntity.delete(collider.handle);
      }
    }

    for (const [entity, body] of context.entityToRigidbody) {
      if (!state.hasComponent(entity, Body)) {
        worldRapier.removeRigidBody(body);
        context.entityToRigidbody.delete(entity);
      }
    }

    for (const [entity, controller] of context.entityToCharacterController) {
      if (!state.hasComponent(entity, CharacterController)) {
        worldRapier.removeCharacterController(controller);
        context.entityToCharacterController.delete(entity);
      }
    }
  },
};

export const CharacterMovementSystem: System = {
  group: 'fixed',
  after: [PhysicsCleanupSystem],
  update: (state) => {
    const context = getPhysicsContext(state);
    if (!context.physicsWorld || context.worldEntity === null) return;

    const gravityY = PhysicsWorld.gravityY[context.worldEntity];

    const entities = characterMovementQuery(state.world);

    for (const entity of entities) {
      const controller = context.entityToCharacterController.get(entity);
      const collider = context.entityToCollider.get(entity);
      const rigidbody = context.entityToRigidbody.get(entity);

      if (!controller || !collider || !rigidbody) continue;

      applyCharacterMovement(
        entity,
        controller,
        collider,
        rigidbody,
        state.time.fixedDeltaTime,
        gravityY
      );
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

    for (const [entity, body] of context.entityToRigidbody) {
      if (state.hasComponent(entity, Body)) {
        syncRigidbodyToECS(entity, body);
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
