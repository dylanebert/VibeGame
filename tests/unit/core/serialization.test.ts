import { describe, it, expect } from 'bun:test';
import { createWorld, defineComponent, addEntity, Types } from 'bitecs';
import {
  serializeComponent,
  deserializeComponent,
} from '../../../src/core/ecs/serialization';

describe('Component Serialization', () => {
  describe('serializeComponent', () => {
    it('serializes component fields to JSON object', () => {
      const Health = defineComponent({
        current: Types.f32,
        max: Types.f32,
      });

      const world = createWorld();
      const eid = addEntity(world);

      Health.current[eid] = 75.5;
      Health.max[eid] = 100;

      const data = serializeComponent(Health, eid);

      expect(data).toEqual({
        current: 75.5,
        max: 100,
      });
    });

    it('serializes transform component with multiple fields', () => {
      const Transform = defineComponent({
        posX: Types.f32,
        posY: Types.f32,
        posZ: Types.f32,
        rotX: Types.f32,
        rotY: Types.f32,
        rotZ: Types.f32,
        rotW: Types.f32,
      });

      const world = createWorld();
      const eid = addEntity(world);

      Transform.posX[eid] = 1;
      Transform.posY[eid] = 2;
      Transform.posZ[eid] = 3;
      Transform.rotX[eid] = 0;
      Transform.rotY[eid] = 0;
      Transform.rotZ[eid] = 0;
      Transform.rotW[eid] = 1;

      const data = serializeComponent(Transform, eid);

      expect(data).toEqual({
        posX: 1,
        posY: 2,
        posZ: 3,
        rotX: 0,
        rotY: 0,
        rotZ: 0,
        rotW: 1,
      });
    });

    it('handles integer types correctly', () => {
      const Counter = defineComponent({
        value: Types.i32,
        ticks: Types.ui32,
      });

      const world = createWorld();
      const eid = addEntity(world);

      Counter.value[eid] = -42;
      Counter.ticks[eid] = 1000;

      const data = serializeComponent(Counter, eid);

      expect(data).toEqual({
        value: -42,
        ticks: 1000,
      });
    });

    it('serializes default values (zeros)', () => {
      const Position = defineComponent({
        x: Types.f32,
        y: Types.f32,
      });

      const world = createWorld();
      const eid = addEntity(world);

      const data = serializeComponent(Position, eid);

      expect(data).toEqual({
        x: 0,
        y: 0,
      });
    });
  });

  describe('deserializeComponent', () => {
    it('deserializes JSON object into component fields', () => {
      const Health = defineComponent({
        current: Types.f32,
        max: Types.f32,
      });

      const world = createWorld();
      const eid = addEntity(world);

      deserializeComponent(Health, eid, {
        current: 50,
        max: 100,
      });

      expect(Health.current[eid]).toBe(50);
      expect(Health.max[eid]).toBe(100);
    });

    it('deserializes transform component', () => {
      const Transform = defineComponent({
        posX: Types.f32,
        posY: Types.f32,
        posZ: Types.f32,
      });

      const world = createWorld();
      const eid = addEntity(world);

      deserializeComponent(Transform, eid, {
        posX: 10.5,
        posY: 20.25,
        posZ: -5.75,
      });

      expect(Transform.posX[eid]).toBe(10.5);
      expect(Transform.posY[eid]).toBe(20.25);
      expect(Transform.posZ[eid]).toBe(-5.75);
    });

    it('handles partial updates', () => {
      const Position = defineComponent({
        x: Types.f32,
        y: Types.f32,
        z: Types.f32,
      });

      const world = createWorld();
      const eid = addEntity(world);

      Position.x[eid] = 1;
      Position.y[eid] = 2;
      Position.z[eid] = 3;

      deserializeComponent(Position, eid, {
        x: 100,
      });

      expect(Position.x[eid]).toBe(100);
      expect(Position.y[eid]).toBe(2);
      expect(Position.z[eid]).toBe(3);
    });

    it('ignores fields not present in component', () => {
      const Health = defineComponent({
        current: Types.f32,
        max: Types.f32,
      });

      const world = createWorld();
      const eid = addEntity(world);

      deserializeComponent(Health, eid, {
        current: 50,
        max: 100,
        nonexistent: 999,
      });

      expect(Health.current[eid]).toBe(50);
      expect(Health.max[eid]).toBe(100);
    });
  });

  describe('Round-trip serialization', () => {
    it('preserves data through serialize and deserialize', () => {
      const Stats = defineComponent({
        strength: Types.i32,
        dexterity: Types.i32,
        intelligence: Types.i32,
        health: Types.f32,
        mana: Types.f32,
      });

      const world = createWorld();
      const eid1 = addEntity(world);
      const eid2 = addEntity(world);

      Stats.strength[eid1] = 10;
      Stats.dexterity[eid1] = 15;
      Stats.intelligence[eid1] = 20;
      Stats.health[eid1] = 100.5;
      Stats.mana[eid1] = 50.25;

      const serialized = serializeComponent(Stats, eid1);
      deserializeComponent(Stats, eid2, serialized);

      expect(Stats.strength[eid2]).toBe(10);
      expect(Stats.dexterity[eid2]).toBe(15);
      expect(Stats.intelligence[eid2]).toBe(20);
      expect(Stats.health[eid2]).toBe(100.5);
      expect(Stats.mana[eid2]).toBe(50.25);
    });

    it('handles multiple entities independently', () => {
      const Position = defineComponent({
        x: Types.f32,
        y: Types.f32,
      });

      const world = createWorld();
      const eid1 = addEntity(world);
      const eid2 = addEntity(world);
      const eid3 = addEntity(world);

      Position.x[eid1] = 10;
      Position.y[eid1] = 20;
      Position.x[eid2] = 30;
      Position.y[eid2] = 40;

      const data1 = serializeComponent(Position, eid1);
      const data2 = serializeComponent(Position, eid2);

      deserializeComponent(Position, eid3, data1);
      expect(Position.x[eid3]).toBe(10);
      expect(Position.y[eid3]).toBe(20);

      deserializeComponent(Position, eid3, data2);
      expect(Position.x[eid3]).toBe(30);
      expect(Position.y[eid3]).toBe(40);
    });
  });
});
