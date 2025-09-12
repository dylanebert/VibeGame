import { beforeEach, describe, expect, it } from 'bun:test';
import { State, defineQuery } from 'vibegame';
import { OrbitCamera } from 'vibegame';

describe('OrbitCamera Component', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
  });

  it('should create orbit camera component with proper field access', () => {
    const cameraEntity = state.createEntity();
    const targetEntity = state.createEntity();
    state.addComponent(cameraEntity, OrbitCamera);

    OrbitCamera.target[cameraEntity] = targetEntity;
    OrbitCamera.currentYaw[cameraEntity] = Math.PI / 4;
    OrbitCamera.currentPitch[cameraEntity] = Math.PI / 6;
    OrbitCamera.currentDistance[cameraEntity] = 15.0;
    OrbitCamera.targetYaw[cameraEntity] = Math.PI / 2;
    OrbitCamera.targetPitch[cameraEntity] = Math.PI / 3;
    OrbitCamera.targetDistance[cameraEntity] = 20.0;
    OrbitCamera.minDistance[cameraEntity] = 2.0;
    OrbitCamera.maxDistance[cameraEntity] = 50.0;
    OrbitCamera.minPitch[cameraEntity] = 0.0;
    OrbitCamera.maxPitch[cameraEntity] = Math.PI / 2;
    OrbitCamera.smoothness[cameraEntity] = 0.5;

    expect(OrbitCamera.target[cameraEntity]).toBe(targetEntity);
    expect(OrbitCamera.currentYaw[cameraEntity]).toBeCloseTo(Math.PI / 4);
    expect(OrbitCamera.currentPitch[cameraEntity]).toBeCloseTo(Math.PI / 6);
    expect(OrbitCamera.currentDistance[cameraEntity]).toBe(15.0);
    expect(OrbitCamera.targetYaw[cameraEntity]).toBeCloseTo(Math.PI / 2);
    expect(OrbitCamera.targetPitch[cameraEntity]).toBeCloseTo(Math.PI / 3);
    expect(OrbitCamera.targetDistance[cameraEntity]).toBe(20.0);
    expect(OrbitCamera.minDistance[cameraEntity]).toBe(2.0);
    expect(OrbitCamera.maxDistance[cameraEntity]).toBe(50.0);
    expect(OrbitCamera.minPitch[cameraEntity]).toBe(0.0);
    expect(OrbitCamera.maxPitch[cameraEntity]).toBeCloseTo(Math.PI / 2);
    expect(OrbitCamera.smoothness[cameraEntity]).toBe(0.5);
  });

  it('should support orbit camera component queries', () => {
    const orbitQuery = defineQuery([OrbitCamera])(state.world);
    expect(orbitQuery).toBeDefined();
  });

  it('should handle zero target entity ID', () => {
    const cameraEntity = state.createEntity();
    state.addComponent(cameraEntity, OrbitCamera);

    OrbitCamera.target[cameraEntity] = 0;
    expect(OrbitCamera.target[cameraEntity]).toBe(0);
  });

  it('should support multiple orbit cameras', () => {
    const camera1 = state.createEntity();
    const camera2 = state.createEntity();
    const target1 = state.createEntity();
    const target2 = state.createEntity();

    state.addComponent(camera1, OrbitCamera);
    state.addComponent(camera2, OrbitCamera);

    OrbitCamera.target[camera1] = target1;
    OrbitCamera.currentDistance[camera1] = 10.0;
    OrbitCamera.smoothness[camera1] = 0.3;

    OrbitCamera.target[camera2] = target2;
    OrbitCamera.currentDistance[camera2] = 25.0;
    OrbitCamera.smoothness[camera2] = 0.7;

    expect(OrbitCamera.target[camera1]).toBe(target1);
    expect(OrbitCamera.target[camera2]).toBe(target2);
    expect(OrbitCamera.currentDistance[camera1]).toBe(10.0);
    expect(OrbitCamera.currentDistance[camera2]).toBe(25.0);
    expect(OrbitCamera.smoothness[camera1]).toBeCloseTo(0.3);
    expect(OrbitCamera.smoothness[camera2]).toBeCloseTo(0.7);
  });
});
