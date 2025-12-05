import { beforeEach, describe, expect, it } from 'bun:test';
import { State } from 'vibegame';
import { TransformsPlugin } from 'vibegame/transforms';
import { ArrangePlugin, Group, Member } from 'vibegame/arrange';

describe('Arrange Components', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(ArrangePlugin);
  });

  describe('Group component', () => {
    it('should register Group component', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Group);
      expect(state.hasComponent(entity, Group)).toBe(true);
    });

    it('should have bitecs type defaults when added directly', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Group);

      expect(Group.strategy[entity]).toBe(0);
    });

    it('should store strategy index', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Group);
      Group.strategy[entity] = 1;
      expect(Group.strategy[entity]).toBe(1);
    });

    it('should store gap value', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Group);
      Group.gap[entity] = 2.5;
      expect(Group.gap[entity]).toBeCloseTo(2.5);
    });

    it('should store weight value', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Group);
      Group.weight[entity] = 0.75;
      expect(Group.weight[entity]).toBeCloseTo(0.75);
    });
  });

  describe('Member component', () => {
    it('should register Member component', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Member);
      expect(state.hasComponent(entity, Member)).toBe(true);
    });

    it('should have default values', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Member);

      expect(Member.group[entity]).toBe(0);
      expect(Member.index[entity]).toBe(0);
    });

    it('should store group reference', () => {
      const groupEntity = state.createEntity();
      state.addComponent(groupEntity, Group);

      const memberEntity = state.createEntity();
      state.addComponent(memberEntity, Member);
      Member.group[memberEntity] = groupEntity;

      expect(Member.group[memberEntity]).toBe(groupEntity);
    });

    it('should store index', () => {
      const entity = state.createEntity();
      state.addComponent(entity, Member);
      Member.index[entity] = 3;
      expect(Member.index[entity]).toBe(3);
    });
  });

  describe('Group-Member relationships', () => {
    it('should establish group-member relationship', () => {
      const groupEntity = state.createEntity();
      state.addComponent(groupEntity, Group);
      Group.gap[groupEntity] = 2;
      Group.weight[groupEntity] = 1;

      const member1 = state.createEntity();
      state.addComponent(member1, Member);
      Member.group[member1] = groupEntity;
      Member.index[member1] = 0;

      const member2 = state.createEntity();
      state.addComponent(member2, Member);
      Member.group[member2] = groupEntity;
      Member.index[member2] = 1;

      const member3 = state.createEntity();
      state.addComponent(member3, Member);
      Member.group[member3] = groupEntity;
      Member.index[member3] = 2;

      expect(Member.group[member1]).toBe(groupEntity);
      expect(Member.group[member2]).toBe(groupEntity);
      expect(Member.group[member3]).toBe(groupEntity);
    });
  });
});
