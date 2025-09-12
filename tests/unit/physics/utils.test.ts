import { beforeEach, describe, expect, it } from 'bun:test';
import { State } from 'vibegame';
import { Body, BodyType, Collider, ColliderShape } from 'vibegame';

describe('Physics Component Behavior', () => {
  let state: State;
  let entity: number;

  beforeEach(() => {
    state = new State();
    entity = state.createEntity();
  });

  describe('Body Type Behavior', () => {
    it('should recognize Fixed body type', () => {
      state.addComponent(entity, Body);
      Body.type[entity] = BodyType.Fixed;
      expect(Body.type[entity]).toBe(BodyType.Fixed);
    });

    it('should recognize Dynamic body type', () => {
      state.addComponent(entity, Body);
      Body.type[entity] = BodyType.Dynamic;
      expect(Body.type[entity]).toBe(BodyType.Dynamic);
    });

    it('should recognize Kinematic body types', () => {
      state.addComponent(entity, Body);

      Body.type[entity] = BodyType.KinematicVelocityBased;
      expect(Body.type[entity]).toBe(BodyType.KinematicVelocityBased);

      Body.type[entity] = BodyType.KinematicPositionBased;
      expect(Body.type[entity]).toBe(BodyType.KinematicPositionBased);
    });
  });

  describe('Collider Shape Behavior', () => {
    it('should handle box collider configuration', () => {
      state.addComponent(entity, Collider);

      Collider.shape[entity] = ColliderShape.Box;
      Collider.sizeX[entity] = 2;
      Collider.sizeY[entity] = 4;
      Collider.sizeZ[entity] = 1;

      expect(Collider.shape[entity]).toBe(ColliderShape.Box);
      expect(Collider.sizeX[entity]).toBe(2);
      expect(Collider.sizeY[entity]).toBe(4);
      expect(Collider.sizeZ[entity]).toBe(1);
    });

    it('should handle sphere collider configuration', () => {
      state.addComponent(entity, Collider);

      Collider.shape[entity] = ColliderShape.Sphere;
      Collider.radius[entity] = 0.5;

      expect(Collider.shape[entity]).toBe(ColliderShape.Sphere);
      expect(Collider.radius[entity]).toBe(0.5);
    });

    it('should handle capsule collider configuration', () => {
      state.addComponent(entity, Collider);

      Collider.shape[entity] = ColliderShape.Capsule;
      Collider.radius[entity] = 0.5;
      Collider.height[entity] = 2;

      expect(Collider.shape[entity]).toBe(ColliderShape.Capsule);
      expect(Collider.radius[entity]).toBe(0.5);
      expect(Collider.height[entity]).toBe(2);
    });
  });
});
