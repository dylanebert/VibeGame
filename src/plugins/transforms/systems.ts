import { System, defineQuery } from '../../core';
import { Parent } from '../recipes';
import * as THREE from 'three';
import { Transform, WorldTransform } from './components';
import {
  composeTransformMatrix,
  copyTransform,
  decomposeTransformMatrix,
  syncEulerFromQuaternion,
  syncQuaternionFromEuler,
} from './utils';

const matrix = new THREE.Matrix4();
const parentMatrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const rotation = new THREE.Quaternion();
const scale = new THREE.Vector3();

const transformQuery = defineQuery([Transform]);

export const TransformHierarchySystem: System = {
  group: 'simulation',
  last: true,
  update: (state) => {
    const entities = transformQuery(state.world);

    for (const entity of entities) {
      syncQuaternionFromEuler(Transform, entity);
    }

    for (const entity of entities) {
      if (!state.hasComponent(entity, WorldTransform)) {
        state.addComponent(entity, WorldTransform);
        WorldTransform.rotX[entity] = 0;
        WorldTransform.rotY[entity] = 0;
        WorldTransform.rotZ[entity] = 0;
        WorldTransform.rotW[entity] = 1;
        WorldTransform.scaleX[entity] = 1;
        WorldTransform.scaleY[entity] = 1;
        WorldTransform.scaleZ[entity] = 1;
      }

      if (!state.hasComponent(entity, Parent)) {
        copyTransform(Transform, WorldTransform, entity);
      } else {
        const parent = Parent.entity[entity];
        if (!state.hasComponent(parent, WorldTransform)) continue;

        composeTransformMatrix(
          WorldTransform,
          parent,
          parentMatrix,
          position,
          rotation,
          scale
        );
        composeTransformMatrix(
          Transform,
          entity,
          matrix,
          position,
          rotation,
          scale
        );

        parentMatrix.multiply(matrix);
        decomposeTransformMatrix(
          parentMatrix,
          WorldTransform,
          entity,
          position,
          rotation,
          scale
        );
      }
    }

    for (const entity of entities) {
      if (
        state.hasComponent(entity, Parent) &&
        state.hasComponent(entity, WorldTransform)
      ) {
        syncEulerFromQuaternion(WorldTransform, entity);
      }
    }
  },
};
