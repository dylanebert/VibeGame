import { beforeEach, describe, expect, it } from 'bun:test';
import { State } from 'vibegame';
import {
  Transform,
  WorldTransform,
  eulerToQuaternion,
  quaternionToEuler,
  syncEulerFromQuaternion,
  syncQuaternionFromEuler,
  copyTransform,
  setTransformIdentity,
  composeTransformMatrix,
  decomposeTransformMatrix,
} from 'vibegame';
import * as THREE from 'three';

describe('Transform Utilities', () => {
  describe('eulerToQuaternion', () => {
    it('should convert identity euler to identity quaternion', () => {
      const quat = eulerToQuaternion(0, 0, 0);
      expect(quat.x).toBeCloseTo(0, 5);
      expect(quat.y).toBeCloseTo(0, 5);
      expect(quat.z).toBeCloseTo(0, 5);
      expect(quat.w).toBeCloseTo(1, 5);
    });

    it('should convert 90 degree Y rotation', () => {
      const quat = eulerToQuaternion(0, 90, 0);
      expect(quat.x).toBeCloseTo(0, 5);
      expect(quat.y).toBeCloseTo(0.7071, 3);
      expect(quat.z).toBeCloseTo(0, 5);
      expect(quat.w).toBeCloseTo(0.7071, 3);
    });

    it('should convert 45 degree rotations on all axes', () => {
      const quat = eulerToQuaternion(45, 45, 45);
      expect(quat.x).toBeCloseTo(0.4619, 3);
      expect(quat.y).toBeCloseTo(0.1913, 3);
      expect(quat.z).toBeCloseTo(0.4619, 3);
      expect(quat.w).toBeCloseTo(0.7325, 3);
    });

    it('should handle negative angles', () => {
      const quat = eulerToQuaternion(-90, 0, 0);
      expect(quat.x).toBeCloseTo(-0.7071, 3);
      expect(quat.y).toBeCloseTo(0, 5);
      expect(quat.z).toBeCloseTo(0, 5);
      expect(quat.w).toBeCloseTo(0.7071, 3);
    });

    it('should handle 180 degree rotation', () => {
      const quat = eulerToQuaternion(0, 180, 0);
      expect(quat.x).toBeCloseTo(0, 5);
      expect(quat.y).toBeCloseTo(1, 3);
      expect(quat.z).toBeCloseTo(0, 5);
      expect(quat.w).toBeCloseTo(0, 5);
    });
  });

  describe('quaternionToEuler', () => {
    it('should convert identity quaternion to identity euler', () => {
      const euler = quaternionToEuler(0, 0, 0, 1);
      expect(euler.x).toBeCloseTo(0, 5);
      expect(euler.y).toBeCloseTo(0, 5);
      expect(euler.z).toBeCloseTo(0, 5);
    });

    it('should convert Y axis quaternion back to euler', () => {
      const euler = quaternionToEuler(0, 0.7071, 0, 0.7071);
      expect(euler.x).toBeCloseTo(0, 5);
      expect(euler.y).toBeCloseTo(89.64513, 3);
      expect(euler.z).toBeCloseTo(0, 5);
    });

    it('should handle gimbal lock edge case', () => {
      const euler = quaternionToEuler(0.7071, 0, 0, 0.7071);
      expect(euler.x).toBeCloseTo(90, 2);
      expect(euler.y).toBeCloseTo(0, 5);
      expect(euler.z).toBeCloseTo(0, 5);
    });
  });

  describe('syncEulerFromQuaternion', () => {
    let state: State;
    let entity: number;

    beforeEach(() => {
      state = new State();
      entity = state.createEntity();
      state.addComponent(entity, Transform);
    });

    it('should sync euler angles from quaternion values', () => {
      Transform.rotX[entity] = 0;
      Transform.rotY[entity] = 0.7071;
      Transform.rotZ[entity] = 0;
      Transform.rotW[entity] = 0.7071;

      syncEulerFromQuaternion(Transform, entity);

      expect(Transform.eulerX[entity]).toBeCloseTo(0, 5);
      expect(Transform.eulerY[entity]).toBeCloseTo(89.644, 2);
      expect(Transform.eulerZ[entity]).toBeCloseTo(0, 5);
    });

    it('should work with WorldTransform component', () => {
      state.addComponent(entity, WorldTransform);
      WorldTransform.rotX[entity] = 0.3827;
      WorldTransform.rotY[entity] = 0;
      WorldTransform.rotZ[entity] = 0;
      WorldTransform.rotW[entity] = 0.9239;

      syncEulerFromQuaternion(WorldTransform, entity);

      expect(WorldTransform.eulerX[entity]).toBeCloseTo(45, 2);
      expect(WorldTransform.eulerY[entity]).toBeCloseTo(0, 5);
      expect(WorldTransform.eulerZ[entity]).toBeCloseTo(0, 5);
    });
  });

  describe('syncQuaternionFromEuler', () => {
    let state: State;
    let entity: number;

    beforeEach(() => {
      state = new State();
      entity = state.createEntity();
      state.addComponent(entity, Transform);
    });

    it('should sync quaternion from euler angles', () => {
      Transform.eulerX[entity] = 0;
      Transform.eulerY[entity] = 45;
      Transform.eulerZ[entity] = 0;

      syncQuaternionFromEuler(Transform, entity);

      expect(Transform.rotX[entity]).toBeCloseTo(0, 5);
      expect(Transform.rotY[entity]).toBeCloseTo(0.3827, 3);
      expect(Transform.rotZ[entity]).toBeCloseTo(0, 5);
      expect(Transform.rotW[entity]).toBeCloseTo(0.9239, 3);
    });

    it('should handle compound rotations', () => {
      Transform.eulerX[entity] = 30;
      Transform.eulerY[entity] = 60;
      Transform.eulerZ[entity] = 90;

      syncQuaternionFromEuler(Transform, entity);

      const euler = quaternionToEuler(
        Transform.rotX[entity],
        Transform.rotY[entity],
        Transform.rotZ[entity],
        Transform.rotW[entity]
      );

      expect(euler.x).toBeCloseTo(30, 1);
      expect(euler.y).toBeCloseTo(60, 1);
      expect(euler.z).toBeCloseTo(90, 1);
    });
  });

  describe('copyTransform', () => {
    let state: State;
    let entity: number;

    beforeEach(() => {
      state = new State();
      entity = state.createEntity();
      state.addComponent(entity, Transform);
      state.addComponent(entity, WorldTransform);
    });

    it('should copy all transform properties', () => {
      Transform.posX[entity] = 10;
      Transform.posY[entity] = 20;
      Transform.posZ[entity] = 30;
      Transform.rotX[entity] = 0.1;
      Transform.rotY[entity] = 0.2;
      Transform.rotZ[entity] = 0.3;
      Transform.rotW[entity] = 0.9;
      Transform.eulerX[entity] = 15;
      Transform.eulerY[entity] = 25;
      Transform.eulerZ[entity] = 35;
      Transform.scaleX[entity] = 2;
      Transform.scaleY[entity] = 3;
      Transform.scaleZ[entity] = 4;

      copyTransform(Transform, WorldTransform, entity);

      expect(WorldTransform.posX[entity]).toBe(10);
      expect(WorldTransform.posY[entity]).toBe(20);
      expect(WorldTransform.posZ[entity]).toBe(30);
      expect(WorldTransform.rotX[entity]).toBeCloseTo(0.1, 5);
      expect(WorldTransform.rotY[entity]).toBeCloseTo(0.2, 5);
      expect(WorldTransform.rotZ[entity]).toBeCloseTo(0.3, 5);
      expect(WorldTransform.rotW[entity]).toBeCloseTo(0.9, 5);
      expect(WorldTransform.eulerX[entity]).toBe(15);
      expect(WorldTransform.eulerY[entity]).toBe(25);
      expect(WorldTransform.eulerZ[entity]).toBe(35);
      expect(WorldTransform.scaleX[entity]).toBe(2);
      expect(WorldTransform.scaleY[entity]).toBe(3);
      expect(WorldTransform.scaleZ[entity]).toBe(4);
    });

    it('should handle copying between same component type', () => {
      const entity2 = state.createEntity();
      state.addComponent(entity2, Transform);

      Transform.posX[entity] = 5;
      Transform.posY[entity] = 10;
      Transform.posZ[entity] = 15;
      Transform.scaleX[entity] = 0.5;
      Transform.scaleY[entity] = 0.5;
      Transform.scaleZ[entity] = 0.5;

      Transform.posX[entity2] = 0;
      Transform.posY[entity2] = 0;
      Transform.posZ[entity2] = 0;

      copyTransform(Transform, Transform, entity);

      expect(Transform.posX[entity]).toBe(5);
      expect(Transform.posY[entity]).toBe(10);
      expect(Transform.posZ[entity]).toBe(15);
      expect(Transform.scaleX[entity]).toBe(0.5);
    });
  });

  describe('setTransformIdentity', () => {
    let state: State;
    let entity: number;

    beforeEach(() => {
      state = new State();
      entity = state.createEntity();
      state.addComponent(entity, Transform);
    });

    it('should reset transform to identity values', () => {
      Transform.posX[entity] = 100;
      Transform.posY[entity] = 200;
      Transform.posZ[entity] = 300;
      Transform.rotX[entity] = 0.5;
      Transform.rotY[entity] = 0.5;
      Transform.rotZ[entity] = 0.5;
      Transform.rotW[entity] = 0.5;
      Transform.eulerX[entity] = 90;
      Transform.eulerY[entity] = 180;
      Transform.eulerZ[entity] = 270;
      Transform.scaleX[entity] = 5;
      Transform.scaleY[entity] = 10;
      Transform.scaleZ[entity] = 15;

      setTransformIdentity(Transform, entity);

      expect(Transform.posX[entity]).toBe(0);
      expect(Transform.posY[entity]).toBe(0);
      expect(Transform.posZ[entity]).toBe(0);
      expect(Transform.rotX[entity]).toBe(0);
      expect(Transform.rotY[entity]).toBe(0);
      expect(Transform.rotZ[entity]).toBe(0);
      expect(Transform.rotW[entity]).toBe(1);
      expect(Transform.eulerX[entity]).toBe(0);
      expect(Transform.eulerY[entity]).toBe(0);
      expect(Transform.eulerZ[entity]).toBe(0);
      expect(Transform.scaleX[entity]).toBe(1);
      expect(Transform.scaleY[entity]).toBe(1);
      expect(Transform.scaleZ[entity]).toBe(1);
    });

    it('should work with WorldTransform', () => {
      state.addComponent(entity, WorldTransform);

      WorldTransform.posX[entity] = 50;
      WorldTransform.scaleX[entity] = 2;
      WorldTransform.rotW[entity] = 0.7071;

      setTransformIdentity(WorldTransform, entity);

      expect(WorldTransform.posX[entity]).toBe(0);
      expect(WorldTransform.scaleX[entity]).toBe(1);
      expect(WorldTransform.rotW[entity]).toBe(1);
    });
  });

  describe('Matrix operations', () => {
    let state: State;
    let entity: number;
    let matrix: THREE.Matrix4;
    let position: THREE.Vector3;
    let rotation: THREE.Quaternion;
    let scale: THREE.Vector3;

    beforeEach(() => {
      state = new State();
      entity = state.createEntity();
      state.addComponent(entity, Transform);
      matrix = new THREE.Matrix4();
      position = new THREE.Vector3();
      rotation = new THREE.Quaternion();
      scale = new THREE.Vector3();
    });

    it('should compose transform into matrix', () => {
      Transform.posX[entity] = 10;
      Transform.posY[entity] = 20;
      Transform.posZ[entity] = 30;
      Transform.rotX[entity] = 0;
      Transform.rotY[entity] = 0.7071;
      Transform.rotZ[entity] = 0;
      Transform.rotW[entity] = 0.7071;
      Transform.scaleX[entity] = 2;
      Transform.scaleY[entity] = 3;
      Transform.scaleZ[entity] = 4;

      composeTransformMatrix(
        Transform,
        entity,
        matrix,
        position,
        rotation,
        scale
      );
      matrix.decompose(position, rotation, scale);

      expect(position.x).toBe(10);
      expect(position.y).toBe(20);
      expect(position.z).toBe(30);
      expect(rotation.x).toBeCloseTo(0, 5);
      expect(rotation.y).toBeCloseTo(0.7071, 3);
      expect(rotation.z).toBeCloseTo(0, 5);
      expect(rotation.w).toBeCloseTo(0.7071, 3);
      expect(scale.x).toBeCloseTo(2, 4);
      expect(scale.y).toBeCloseTo(3, 4);
      expect(scale.z).toBeCloseTo(4, 3);
    });

    it('should decompose matrix into transform', () => {
      position.set(5, 15, 25);
      rotation.set(0, 0.3827, 0, 0.9239);
      scale.set(0.5, 1.5, 2.5);
      matrix.compose(position, rotation, scale);

      decomposeTransformMatrix(
        matrix,
        Transform,
        entity,
        position,
        rotation,
        scale
      );

      expect(Transform.posX[entity]).toBe(5);
      expect(Transform.posY[entity]).toBe(15);
      expect(Transform.posZ[entity]).toBe(25);
      expect(Transform.rotX[entity]).toBeCloseTo(0, 5);
      expect(Transform.rotY[entity]).toBeCloseTo(0.3827, 3);
      expect(Transform.rotZ[entity]).toBeCloseTo(0, 5);
      expect(Transform.rotW[entity]).toBeCloseTo(0.9239, 3);
      expect(Transform.eulerY[entity]).toBeCloseTo(45, 1);
      expect(Transform.scaleX[entity]).toBeCloseTo(0.5, 4);
      expect(Transform.scaleY[entity]).toBeCloseTo(1.5, 4);
      expect(Transform.scaleZ[entity]).toBeCloseTo(2.5, 4);
    });

    it('should roundtrip transform through matrix operations', () => {
      Transform.posX[entity] = 7;
      Transform.posY[entity] = 14;
      Transform.posZ[entity] = 21;
      Transform.eulerX[entity] = 30;
      Transform.eulerY[entity] = 60;
      Transform.eulerZ[entity] = 90;
      syncQuaternionFromEuler(Transform, entity);
      Transform.scaleX[entity] = 1.2;
      Transform.scaleY[entity] = 1.4;
      Transform.scaleZ[entity] = 1.6;

      composeTransformMatrix(
        Transform,
        entity,
        matrix,
        position,
        rotation,
        scale
      );

      const entity2 = state.createEntity();
      state.addComponent(entity2, Transform);
      decomposeTransformMatrix(
        matrix,
        Transform,
        entity2,
        position,
        rotation,
        scale
      );

      expect(Transform.posX[entity2]).toBeCloseTo(7, 5);
      expect(Transform.posY[entity2]).toBeCloseTo(14, 5);
      expect(Transform.posZ[entity2]).toBeCloseTo(21, 5);
      expect(Transform.eulerX[entity2]).toBeCloseTo(30, 1);
      expect(Transform.eulerY[entity2]).toBeCloseTo(60, 1);
      expect(Transform.eulerZ[entity2]).toBeCloseTo(90, 1);
      expect(Transform.scaleX[entity2]).toBeCloseTo(1.2, 5);
      expect(Transform.scaleY[entity2]).toBeCloseTo(1.4, 5);
      expect(Transform.scaleZ[entity2]).toBeCloseTo(1.6, 5);
    });
  });
});
