import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import {
  Body,
  BodyType,
  CharacterController,
  CharacterMovement,
  Collider,
  ColliderShape,
  defineQuery,
  initializePhysics,
  InputButtons,
  InputState,
  OrbitCamera,
  OrbitCameraPlugin,
  PhysicsPlugin,
  Player,
  PlayerPlugin,
  setButton,
  State,
  TIME_CONSTANTS,
  Transform,
  TransformsPlugin,
  WorldTransform,
} from 'vibegame';

describe('Player Movement', () => {
  let state: State;

  beforeAll(async () => {
    await initializePhysics();
  });

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(PhysicsPlugin);
    state.registerPlugin(OrbitCameraPlugin);
    state.registerPlugin(PlayerPlugin);
  });

  function createPlayer(x = 0, y = 5, z = 0): number {
    const player = state.createEntity();
    state.addComponent(player, Player);
    state.addComponent(player, InputState);
    state.addComponent(player, Body);
    state.addComponent(player, Collider);
    state.addComponent(player, CharacterController);
    state.addComponent(player, CharacterMovement);
    state.addComponent(player, Transform);
    state.addComponent(player, WorldTransform);

    Player.speed[player] = 10;
    Player.jumpHeight[player] = 3;
    Player.rotationSpeed[player] = 10;
    Player.canJump[player] = 1;
    Player.isJumping[player] = 0;
    Player.jumpCooldown[player] = 0;
    Player.lastGroundedTime[player] = 0;
    Player.jumpBufferTime[player] = -10000;

    Body.type[player] = BodyType.KinematicPositionBased;
    Body.posX[player] = x;
    Body.posY[player] = y;
    Body.posZ[player] = z;
    Body.gravityScale[player] = 1;
    Body.rotW[player] = 1;

    Collider.shape[player] = ColliderShape.Capsule;
    Collider.radius[player] = 0.5;
    Collider.height[player] = 1;

    CharacterController.offset[player] = 0.01;
    CharacterController.upY[player] = 1;

    CharacterMovement.velocityY[player] = 0;

    Transform.posX[player] = x;
    Transform.posY[player] = y;
    Transform.posZ[player] = z;
    Transform.rotW[player] = 1;

    return player;
  }

  function createFloor(): number {
    const floor = state.createEntity();
    state.addComponent(floor, Body);
    state.addComponent(floor, Collider);
    state.addComponent(floor, Transform);

    Body.type[floor] = BodyType.Fixed;
    Body.posY[floor] = 0;
    Body.rotW[floor] = 1;

    Collider.shape[floor] = ColliderShape.Box;
    Collider.sizeX[floor] = 100;
    Collider.sizeY[floor] = 1;
    Collider.sizeZ[floor] = 100;

    return floor;
  }

  function createCamera(): number {
    const camera = state.createEntity();
    state.addComponent(camera, OrbitCamera);
    OrbitCamera.currentYaw[camera] = 0;
    return camera;
  }

  describe('Basic Movement', () => {
    it('should move forward based on input', () => {
      createFloor();
      const player = createPlayer(0, 2, 0);
      createCamera();

      InputState.moveY[player] = 1;
      InputState.moveX[player] = 0;

      const initialZ = Body.posZ[player];

      for (let i = 0; i < 10; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      expect(Body.posZ[player]).toBeLessThan(initialZ);
      expect(Math.abs(Body.posZ[player] - initialZ)).toBeGreaterThan(0.5);
    });

    it('should move sideways based on input', () => {
      createFloor();
      const player = createPlayer(0, 2, 0);
      createCamera();

      InputState.moveY[player] = 0;
      InputState.moveX[player] = 1;

      const initialX = Body.posX[player];

      for (let i = 0; i < 10; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      expect(Body.posX[player]).toBeGreaterThan(initialX);
      expect(Math.abs(Body.posX[player] - initialX)).toBeGreaterThan(0.5);
    });

    it('should normalize diagonal movement', () => {
      createFloor();
      const player = createPlayer(0, 2, 0);
      createCamera();

      InputState.moveY[player] = 1;
      InputState.moveX[player] = 1;

      const initialX = Body.posX[player];
      const initialZ = Body.posZ[player];

      for (let i = 0; i < 10; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      const deltaX = Body.posX[player] - initialX;
      const deltaZ = Body.posZ[player] - initialZ;
      const totalDistance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

      const forwardOnlyPlayer = createPlayer(10, 2, 0);
      InputState.moveY[forwardOnlyPlayer] = 1;
      InputState.moveX[forwardOnlyPlayer] = 0;

      const forwardInitialZ = Body.posZ[forwardOnlyPlayer];

      for (let i = 0; i < 10; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      const forwardDistance = Math.abs(
        Body.posZ[forwardOnlyPlayer] - forwardInitialZ
      );

      expect(totalDistance).toBeCloseTo(forwardDistance, 0);
    });

    it('should respect player speed setting', () => {
      createFloor();
      const slowPlayer = createPlayer(0, 2, 0);
      const fastPlayer = createPlayer(10, 2, 0);
      createCamera();

      Player.speed[slowPlayer] = 5;
      Player.speed[fastPlayer] = 15;

      InputState.moveY[slowPlayer] = 1;
      InputState.moveY[fastPlayer] = 1;

      const slowInitialZ = Body.posZ[slowPlayer];
      const fastInitialZ = Body.posZ[fastPlayer];

      for (let i = 0; i < 10; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      const slowDistance = Math.abs(Body.posZ[slowPlayer] - slowInitialZ);
      const fastDistance = Math.abs(Body.posZ[fastPlayer] - fastInitialZ);

      expect(fastDistance).toBeGreaterThan(slowDistance * 1.5);
      expect(fastDistance).toBeLessThan(slowDistance * 3.5);
    });
  });

  describe('Camera-Relative Movement', () => {
    it('should move relative to camera yaw', () => {
      createFloor();
      const player = createPlayer(0, 2, 0);
      const camera = createCamera();

      OrbitCamera.currentYaw[camera] = Math.PI / 2;

      InputState.moveY[player] = 1;
      InputState.moveX[player] = 0;

      const initialX = Body.posX[player];
      const initialZ = Body.posZ[player];

      for (let i = 0; i < 10; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      expect(Body.posX[player]).toBeLessThan(initialX - 0.5);
      expect(Math.abs(Body.posZ[player] - initialZ)).toBeLessThan(0.5);
    });

    it('should handle full 360 degree camera rotation', () => {
      createFloor();
      const player = createPlayer(0, 2, 0);
      const camera = createCamera();

      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      const expectedDirections = [
        { x: 0, z: -1 },
        { x: -1, z: 0 },
        { x: 0, z: 1 },
        { x: 1, z: 0 },
      ];

      for (let i = 0; i < angles.length; i++) {
        Body.posX[player] = 0;
        Body.posZ[player] = 0;
        OrbitCamera.currentYaw[camera] = angles[i];

        InputState.moveY[player] = 1;
        InputState.moveX[player] = 0;

        for (let j = 0; j < 10; j++) {
          state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
        }

        const deltaX = Body.posX[player];
        const deltaZ = Body.posZ[player];

        const normalizedX =
          deltaX / Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
        const normalizedZ =
          deltaZ / Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

        expect(normalizedX).toBeCloseTo(expectedDirections[i].x, 0);
        expect(normalizedZ).toBeCloseTo(expectedDirections[i].z, 0);
      }
    });
  });

  describe('Player Rotation', () => {
    it('should rotate toward movement direction', () => {
      createFloor();
      const player = createPlayer(0, 2, 0);
      createCamera();

      InputState.moveY[player] = 0;
      InputState.moveX[player] = 1;

      for (let i = 0; i < 20; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      const quatY = Body.rotY[player];
      expect(Math.abs(quatY)).toBeGreaterThan(0.1);
    });

    it('should smoothly interpolate rotation', () => {
      createFloor();
      const player = createPlayer(0, 2, 0);
      createCamera();

      Player.rotationSpeed[player] = 5;

      InputState.moveY[player] = 0;
      InputState.moveX[player] = 1;

      const rotationSteps: number[] = [];

      for (let i = 0; i < 10; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
        rotationSteps.push(Body.rotY[player]);
      }

      for (let i = 1; i < rotationSteps.length; i++) {
        const delta = Math.abs(rotationSteps[i] - rotationSteps[i - 1]);
        expect(delta).toBeLessThan(0.2);
      }
    });

    it('should not rotate when stationary', () => {
      createFloor();
      const player = createPlayer(0, 2, 0);
      createCamera();

      Body.rotY[player] = 0.5;
      const initialRotY = Body.rotY[player];

      InputState.moveY[player] = 0;
      InputState.moveX[player] = 0;

      for (let i = 0; i < 10; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      expect(Body.rotY[player]).toBeCloseTo(initialRotY, 3);
    });
  });

  describe('Collision Handling', () => {
    it('should stop at walls', () => {
      createFloor();
      const player = createPlayer(0, 2, 0);
      createCamera();

      const wall = state.createEntity();
      state.addComponent(wall, Body);
      state.addComponent(wall, Collider);
      state.addComponent(wall, Transform);

      Body.type[wall] = BodyType.Fixed;
      Body.posX[wall] = 0;
      Body.posY[wall] = 2;
      Body.posZ[wall] = -3;
      Body.rotW[wall] = 1;

      Collider.shape[wall] = ColliderShape.Box;
      Collider.sizeX[wall] = 10;
      Collider.sizeY[wall] = 4;
      Collider.sizeZ[wall] = 1;

      InputState.moveY[player] = 1;

      for (let i = 0; i < 50; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      expect(Body.posZ[player]).toBeGreaterThan(-2.5);
    });

    it('should slide along walls', () => {
      createFloor();
      const player = createPlayer(0, 2, 0);
      createCamera();

      const wall = state.createEntity();
      state.addComponent(wall, Body);
      state.addComponent(wall, Collider);
      state.addComponent(wall, Transform);

      Body.type[wall] = BodyType.Fixed;
      Body.posX[wall] = 0;
      Body.posY[wall] = 2;
      Body.posZ[wall] = -2;
      Body.rotW[wall] = 1;

      Collider.shape[wall] = ColliderShape.Box;
      Collider.sizeX[wall] = 10;
      Collider.sizeY[wall] = 4;
      Collider.sizeZ[wall] = 1;

      InputState.moveY[player] = 1;
      InputState.moveX[player] = 1;

      for (let i = 0; i < 30; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      expect(Body.posX[player]).toBeGreaterThan(0.5);
      expect(Body.posZ[player]).toBeGreaterThan(-1.5);
    });
  });

  describe('Ground Detection', () => {
    it('should detect when grounded', () => {
      createFloor();
      const player = createPlayer(0, 1.5, 0);
      createCamera();

      for (let i = 0; i < 30; i++) {
        state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      }

      expect(CharacterController.grounded[player]).toBe(1);
    });

    it('should detect when airborne', () => {
      const player = createPlayer(0, 10, 0);
      createCamera();

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      expect(CharacterController.grounded[player]).toBe(0);
    });
  });

  describe('Accessing Player Component in Systems', () => {
    it('should allow checking and modifying player state in systems', () => {
      createFloor();
      const player = createPlayer(0, 10, 0);
      createCamera();

      let jumpDetected = false;
      let speedModified = false;

      const MySystem = {
        update: (state: State) => {
          const players = defineQuery([Player])(state.world);
          for (const entity of players) {
            if (Player.isJumping[entity]) {
              jumpDetected = true;
            }

            Player.speed[entity] = 10;
            speedModified = true;
          }
        },
      };

      Player.speed[player] = 5;
      expect(Player.speed[player]).toBe(5);

      MySystem.update(state);
      expect(speedModified).toBe(true);
      expect(Player.speed[player]).toBe(10);

      setButton(player, InputButtons.JUMP, true);
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      Player.isJumping[player] = 1;
      MySystem.update(state);
      expect(jumpDetected).toBe(true);
    });

    it('should handle multiple players in system queries', () => {
      createFloor();
      createPlayer(0, 2, 0);
      createPlayer(5, 2, 5);
      createCamera();

      let playerCount = 0;
      const speeds: number[] = [];

      const CountingSystem = {
        update: (state: State) => {
          const players = defineQuery([Player])(state.world);
          playerCount = players.length;
          for (const entity of players) {
            speeds.push(Player.speed[entity]);
          }
        },
      };

      CountingSystem.update(state);
      expect(playerCount).toBe(2);
      expect(speeds).toEqual([10, 10]);
    });
  });
});
