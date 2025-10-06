import {
  State,
  TIME_CONSTANTS,
  OrbitCamera,
  OrbitCameraPlugin,
  Transform,
  TransformsPlugin,
  WorldTransform,
  defineQuery,
} from 'vibegame';
import { beforeEach, describe, expect, it } from 'bun:test';

describe('OrbitCamera System Integration', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(OrbitCameraPlugin);
  });

  it('should update camera when target moves', () => {
    const targetEntity = state.createEntity();
    const cameraEntity = state.createEntity();

    state.addComponent(targetEntity, WorldTransform);
    state.addComponent(cameraEntity, OrbitCamera);
    state.addComponent(cameraEntity, Transform);

    // Set up initial positions
    WorldTransform.posX[targetEntity] = 0;
    WorldTransform.posY[targetEntity] = 0;
    WorldTransform.posZ[targetEntity] = 0;

    // Configure orbit camera
    OrbitCamera.target[cameraEntity] = targetEntity;
    OrbitCamera.currentDistance[cameraEntity] = 10;
    OrbitCamera.targetDistance[cameraEntity] = 10;
    OrbitCamera.currentYaw[cameraEntity] = 0;
    OrbitCamera.targetYaw[cameraEntity] = 0;
    OrbitCamera.currentPitch[cameraEntity] = Math.PI / 4;
    OrbitCamera.targetPitch[cameraEntity] = Math.PI / 4;
    OrbitCamera.smoothness[cameraEntity] = 1.0;

    // Simulate a frame with deltaTime
    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    // Camera should have moved from initial position
    const cameraMoved =
      Transform.posX[cameraEntity] !== 0 ||
      Transform.posY[cameraEntity] !== 0 ||
      Transform.posZ[cameraEntity] !== 0;
    expect(cameraMoved).toBe(true);

    // Now move target and verify camera follows
    const oldCameraX = Transform.posX[cameraEntity];
    const oldCameraY = Transform.posY[cameraEntity];
    const oldCameraZ = Transform.posZ[cameraEntity];

    WorldTransform.posX[targetEntity] = 10;
    WorldTransform.posY[targetEntity] = 5;
    WorldTransform.posZ[targetEntity] = -3;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    // Camera should have moved to follow target
    expect(Transform.posX[cameraEntity]).not.toBe(oldCameraX);
    expect(Transform.posY[cameraEntity]).not.toBe(oldCameraY);
    expect(Transform.posZ[cameraEntity]).not.toBe(oldCameraZ);
  });

  it('should handle missing target gracefully', () => {
    const cameraEntity = state.createEntity();
    state.addComponent(cameraEntity, OrbitCamera);
    state.addComponent(cameraEntity, Transform);

    OrbitCamera.target[cameraEntity] = 999;
    const initialPosX = Transform.posX[cameraEntity];
    const initialPosY = Transform.posY[cameraEntity];
    const initialPosZ = Transform.posZ[cameraEntity];

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(Transform.posX[cameraEntity]).toBe(initialPosX);
    expect(Transform.posY[cameraEntity]).toBe(initialPosY);
    expect(Transform.posZ[cameraEntity]).toBe(initialPosZ);
  });

  it('should handle zero target entity', () => {
    const cameraEntity = state.createEntity();
    state.addComponent(cameraEntity, OrbitCamera);
    state.addComponent(cameraEntity, Transform);

    OrbitCamera.target[cameraEntity] = 0;
    const initialPosX = Transform.posX[cameraEntity];

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(Transform.posX[cameraEntity]).toBe(initialPosX);
  });

  it('should handle target without WorldTransform', () => {
    const targetEntity = state.createEntity();
    const cameraEntity = state.createEntity();

    state.addComponent(cameraEntity, OrbitCamera);
    state.addComponent(cameraEntity, Transform);

    OrbitCamera.target[cameraEntity] = targetEntity;
    const initialPosX = Transform.posX[cameraEntity];

    state.step();

    expect(Transform.posX[cameraEntity]).toBe(initialPosX);
  });

  it('should support multiple orbit cameras tracking different targets', () => {
    const target1 = state.createEntity();
    const target2 = state.createEntity();
    const camera1 = state.createEntity();
    const camera2 = state.createEntity();

    state.addComponent(target1, WorldTransform);
    state.addComponent(target2, WorldTransform);
    state.addComponent(camera1, OrbitCamera);
    state.addComponent(camera1, Transform);
    state.addComponent(camera2, OrbitCamera);
    state.addComponent(camera2, Transform);

    WorldTransform.posX[target1] = 10;
    WorldTransform.posY[target1] = 0;
    WorldTransform.posZ[target1] = 0;

    WorldTransform.posX[target2] = -10;
    WorldTransform.posY[target2] = 5;
    WorldTransform.posZ[target2] = 3;

    OrbitCamera.target[camera1] = target1;
    OrbitCamera.currentDistance[camera1] = 5;
    OrbitCamera.targetDistance[camera1] = 5;
    OrbitCamera.smoothness[camera1] = 1.0;

    OrbitCamera.target[camera2] = target2;
    OrbitCamera.currentDistance[camera2] = 15;
    OrbitCamera.targetDistance[camera2] = 15;
    OrbitCamera.smoothness[camera2] = 1.0;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(Transform.posX[camera1]).not.toBe(Transform.posX[camera2]);
    expect(Transform.posY[camera1]).not.toBe(Transform.posY[camera2]);
    expect(Transform.posZ[camera1]).not.toBe(Transform.posZ[camera2]);
  });

  it('should smooth towards target values over time', () => {
    const targetEntity = state.createEntity();
    const cameraEntity = state.createEntity();

    state.addComponent(targetEntity, WorldTransform);
    state.addComponent(cameraEntity, OrbitCamera);
    state.addComponent(cameraEntity, Transform);

    WorldTransform.posX[targetEntity] = 0;
    WorldTransform.posY[targetEntity] = 0;
    WorldTransform.posZ[targetEntity] = 0;

    OrbitCamera.target[cameraEntity] = targetEntity;
    OrbitCamera.currentYaw[cameraEntity] = 0;
    OrbitCamera.targetYaw[cameraEntity] = Math.PI / 2;
    OrbitCamera.currentDistance[cameraEntity] = 10;
    OrbitCamera.targetDistance[cameraEntity] = 20;
    OrbitCamera.smoothness[cameraEntity] = 0.3;

    const initialYaw = OrbitCamera.currentYaw[cameraEntity];
    const initialDistance = OrbitCamera.currentDistance[cameraEntity];

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const newYaw = OrbitCamera.currentYaw[cameraEntity];
    const newDistance = OrbitCamera.currentDistance[cameraEntity];

    expect(newYaw).toBeGreaterThan(initialYaw);
    expect(newYaw).toBeLessThan(OrbitCamera.targetYaw[cameraEntity]);
    expect(newDistance).toBeGreaterThan(initialDistance);
    expect(newDistance).toBeLessThan(OrbitCamera.targetDistance[cameraEntity]);
  });

  it('should skip cameras without Transform', () => {
    const targetEntity = state.createEntity();
    const cameraEntity = state.createEntity();

    state.addComponent(targetEntity, WorldTransform);
    state.addComponent(cameraEntity, OrbitCamera);

    OrbitCamera.target[cameraEntity] = targetEntity;

    expect(() => {
      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    }).not.toThrow();
  });

  describe('Programmatic Control', () => {
    it('should rotate camera on mouse input', () => {
      const targetEntity = state.createEntity();
      const cameraEntity = state.createEntity();

      state.addComponent(targetEntity, WorldTransform);
      state.addComponent(cameraEntity, OrbitCamera);
      state.addComponent(cameraEntity, Transform);

      OrbitCamera.target[cameraEntity] = targetEntity;
      OrbitCamera.targetYaw[cameraEntity] = 0;

      const mockMouseDeltaX = 50;
      const rotationSpeed = 0.01;
      OrbitCamera.targetYaw[cameraEntity] += mockMouseDeltaX * rotationSpeed;

      expect(OrbitCamera.targetYaw[cameraEntity]).toBeCloseTo(0.5, 5);
    });

    it('should zoom camera on mouse wheel', () => {
      const targetEntity = state.createEntity();
      const cameraEntity = state.createEntity();

      state.addComponent(targetEntity, WorldTransform);
      state.addComponent(cameraEntity, OrbitCamera);
      state.addComponent(cameraEntity, Transform);

      OrbitCamera.target[cameraEntity] = targetEntity;
      OrbitCamera.minDistance[cameraEntity] = 2;
      OrbitCamera.maxDistance[cameraEntity] = 20;
      OrbitCamera.targetDistance[cameraEntity] = 10;

      const mockWheelDelta = 4;
      const zoomSpeed = 0.5;
      const newDistance =
        OrbitCamera.targetDistance[cameraEntity] - mockWheelDelta * zoomSpeed;
      OrbitCamera.targetDistance[cameraEntity] = Math.max(
        OrbitCamera.minDistance[cameraEntity],
        Math.min(OrbitCamera.maxDistance[cameraEntity], newDistance)
      );

      expect(OrbitCamera.targetDistance[cameraEntity]).toBe(8);
    });

    it('should clamp zoom to min and max distance', () => {
      const targetEntity = state.createEntity();
      const cameraEntity = state.createEntity();

      state.addComponent(targetEntity, WorldTransform);
      state.addComponent(cameraEntity, OrbitCamera);
      state.addComponent(cameraEntity, Transform);

      OrbitCamera.target[cameraEntity] = targetEntity;
      OrbitCamera.minDistance[cameraEntity] = 5;
      OrbitCamera.maxDistance[cameraEntity] = 15;

      OrbitCamera.targetDistance[cameraEntity] = 5;
      const largeWheelDelta = 20;
      const zoomSpeed = 0.5;
      let newDistance =
        OrbitCamera.targetDistance[cameraEntity] - largeWheelDelta * zoomSpeed;
      OrbitCamera.targetDistance[cameraEntity] = Math.max(
        OrbitCamera.minDistance[cameraEntity],
        Math.min(OrbitCamera.maxDistance[cameraEntity], newDistance)
      );
      expect(OrbitCamera.targetDistance[cameraEntity]).toBe(5);

      OrbitCamera.targetDistance[cameraEntity] = 15;
      const largeWheelDeltaNegative = -20;
      newDistance =
        OrbitCamera.targetDistance[cameraEntity] -
        largeWheelDeltaNegative * zoomSpeed;
      OrbitCamera.targetDistance[cameraEntity] = Math.max(
        OrbitCamera.minDistance[cameraEntity],
        Math.min(OrbitCamera.maxDistance[cameraEntity], newDistance)
      );
      expect(OrbitCamera.targetDistance[cameraEntity]).toBe(15);
    });

    it('should dynamically switch camera target', () => {
      const target1 = state.createEntity();
      const target2 = state.createEntity();
      const cameraEntity = state.createEntity();

      state.addComponent(target1, WorldTransform);
      state.addComponent(target2, WorldTransform);
      state.addComponent(cameraEntity, OrbitCamera);
      state.addComponent(cameraEntity, Transform);

      WorldTransform.posX[target1] = 10;
      WorldTransform.posY[target1] = 0;
      WorldTransform.posZ[target1] = 0;

      WorldTransform.posX[target2] = -10;
      WorldTransform.posY[target2] = 5;
      WorldTransform.posZ[target2] = 3;

      OrbitCamera.target[cameraEntity] = target1;
      OrbitCamera.currentDistance[cameraEntity] = 10;
      OrbitCamera.targetDistance[cameraEntity] = 10;
      OrbitCamera.smoothness[cameraEntity] = 1.0;

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      const firstTargetCamX = Transform.posX[cameraEntity];
      const firstTargetCamY = Transform.posY[cameraEntity];
      const firstTargetCamZ = Transform.posZ[cameraEntity];

      OrbitCamera.target[cameraEntity] = target2;

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
      const secondTargetCamX = Transform.posX[cameraEntity];
      const secondTargetCamY = Transform.posY[cameraEntity];
      const secondTargetCamZ = Transform.posZ[cameraEntity];

      expect(firstTargetCamX).not.toBe(secondTargetCamX);
      expect(firstTargetCamY).not.toBe(secondTargetCamY);
      expect(firstTargetCamZ).not.toBe(secondTargetCamZ);
    });

    it('should handle pitch adjustment with constraints', () => {
      const targetEntity = state.createEntity();
      const cameraEntity = state.createEntity();

      state.addComponent(targetEntity, WorldTransform);
      state.addComponent(cameraEntity, OrbitCamera);
      state.addComponent(cameraEntity, Transform);

      OrbitCamera.target[cameraEntity] = targetEntity;
      OrbitCamera.minPitch[cameraEntity] = 0.1;
      OrbitCamera.maxPitch[cameraEntity] = Math.PI / 2 - 0.1;
      OrbitCamera.targetPitch[cameraEntity] = Math.PI / 4;

      const mockMouseDeltaY = 30;
      const rotationSpeed = 0.01;
      let newPitch =
        OrbitCamera.targetPitch[cameraEntity] + mockMouseDeltaY * rotationSpeed;
      OrbitCamera.targetPitch[cameraEntity] = Math.max(
        OrbitCamera.minPitch[cameraEntity],
        Math.min(OrbitCamera.maxPitch[cameraEntity], newPitch)
      );

      expect(OrbitCamera.targetPitch[cameraEntity]).toBeGreaterThan(
        Math.PI / 4
      );
      expect(OrbitCamera.targetPitch[cameraEntity]).toBeLessThan(Math.PI / 2);
    });

    it('should query and update multiple cameras', () => {
      const cameras = [];
      const targets = [];

      for (let i = 0; i < 3; i++) {
        const target = state.createEntity();
        const camera = state.createEntity();

        state.addComponent(target, WorldTransform);
        state.addComponent(camera, OrbitCamera);
        state.addComponent(camera, Transform);

        OrbitCamera.target[camera] = target;
        OrbitCamera.targetDistance[camera] = 10 + i * 5;

        cameras.push(camera);
        targets.push(target);
      }

      const queriedCameras = defineQuery([OrbitCamera])(state.world);
      let count = 0;

      for (const camera of queriedCameras) {
        const mockWheelDelta = 2;
        const zoomSpeed = 0.5;
        OrbitCamera.targetDistance[camera] -= mockWheelDelta * zoomSpeed;
        count++;
      }

      expect(count).toBe(3);
      expect(OrbitCamera.targetDistance[cameras[0]]).toBe(9);
      expect(OrbitCamera.targetDistance[cameras[1]]).toBe(14);
      expect(OrbitCamera.targetDistance[cameras[2]]).toBe(19);
    });
  });

  describe('Camera with Offsets', () => {
    it('should apply offset values correctly', () => {
      const targetEntity = state.createEntity();
      const cameraEntity = state.createEntity();

      state.addComponent(targetEntity, WorldTransform);
      state.addComponent(cameraEntity, OrbitCamera);
      state.addComponent(cameraEntity, Transform);

      WorldTransform.posX[targetEntity] = 5;
      WorldTransform.posY[targetEntity] = 0;
      WorldTransform.posZ[targetEntity] = 5;

      OrbitCamera.target[cameraEntity] = targetEntity;
      OrbitCamera.offsetX[cameraEntity] = 2;
      OrbitCamera.offsetY[cameraEntity] = 3;
      OrbitCamera.offsetZ[cameraEntity] = -1;
      OrbitCamera.currentDistance[cameraEntity] = 10;
      OrbitCamera.targetDistance[cameraEntity] = 10;
      OrbitCamera.currentYaw[cameraEntity] = 0;
      OrbitCamera.targetYaw[cameraEntity] = 0;
      OrbitCamera.currentPitch[cameraEntity] = Math.PI / 4;
      OrbitCamera.targetPitch[cameraEntity] = Math.PI / 4;
      OrbitCamera.smoothness[cameraEntity] = 1.0;

      state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

      const expectedTargetX =
        WorldTransform.posX[targetEntity] + OrbitCamera.offsetX[cameraEntity];
      const expectedTargetY =
        WorldTransform.posY[targetEntity] + OrbitCamera.offsetY[cameraEntity];
      const expectedTargetZ =
        WorldTransform.posZ[targetEntity] + OrbitCamera.offsetZ[cameraEntity];

      const sin = Math.sin(OrbitCamera.currentYaw[cameraEntity]);
      const cos = Math.cos(OrbitCamera.currentYaw[cameraEntity]);
      const pitchSin = Math.sin(OrbitCamera.currentPitch[cameraEntity]);
      const pitchCos = Math.cos(OrbitCamera.currentPitch[cameraEntity]);

      const expectedCameraX =
        expectedTargetX +
        sin * pitchCos * OrbitCamera.currentDistance[cameraEntity];
      const expectedCameraY =
        expectedTargetY + pitchSin * OrbitCamera.currentDistance[cameraEntity];
      const expectedCameraZ =
        expectedTargetZ +
        cos * pitchCos * OrbitCamera.currentDistance[cameraEntity];

      expect(Transform.posX[cameraEntity]).toBeCloseTo(expectedCameraX, 1);
      expect(Transform.posY[cameraEntity]).toBeCloseTo(expectedCameraY, 1);
      expect(Transform.posZ[cameraEntity]).toBeCloseTo(expectedCameraZ, 1);
    });
  });
});
