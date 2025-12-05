import { beforeEach, describe, expect, it } from 'bun:test';
import { State } from 'vibegame';
import { Transform, TransformsPlugin } from 'vibegame/transforms';
import { ArrangePlugin, Group, Member } from 'vibegame/arrange';

describe('Arrange System', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(ArrangePlugin);
  });

  describe('weight behavior', () => {
    it('should not move members when weight=0', () => {
      const group = state.createEntity();
      state.addComponent(group, Group);
      Group.gap[group] = 5;
      Group.weight[group] = 0;

      const member = state.createEntity();
      state.addComponent(member, Transform);
      state.addComponent(member, Member);
      Transform.posX[member] = 10;
      Member.group[member] = group;
      Member.index[member] = 0;

      state.step(1 / 60);
      expect(Transform.posX[member]).toBe(10);
    });

    it('should arrange members when weight > 0', () => {
      const group = state.createEntity();
      state.addComponent(group, Group);
      Group.gap[group] = 4;
      Group.weight[group] = 1;

      const member0 = state.createEntity();
      state.addComponent(member0, Transform);
      state.addComponent(member0, Member);
      Transform.posX[member0] = 100;
      Member.group[member0] = group;
      Member.index[member0] = 0;

      const member1 = state.createEntity();
      state.addComponent(member1, Transform);
      state.addComponent(member1, Member);
      Transform.posX[member1] = 200;
      Member.group[member1] = group;
      Member.index[member1] = 1;

      state.step(1 / 60);

      // Horizontal strategy: gap=4, count=2 => positions at -2 and 2
      expect(Transform.posX[member0]).toBe(-2);
      expect(Transform.posX[member1]).toBe(2);
    });

    it('should freeze position when weight becomes 0', () => {
      const group = state.createEntity();
      state.addComponent(group, Group);
      Group.gap[group] = 4;
      Group.weight[group] = 1;

      const member0 = state.createEntity();
      state.addComponent(member0, Transform);
      state.addComponent(member0, Member);
      Transform.posX[member0] = 100;
      Member.group[member0] = group;
      Member.index[member0] = 0;

      const member1 = state.createEntity();
      state.addComponent(member1, Transform);
      state.addComponent(member1, Member);
      Member.group[member1] = group;
      Member.index[member1] = 1;

      // First step: arrange
      state.step(1 / 60);
      expect(Transform.posX[member0]).toBe(-2);

      // Set weight to 0
      Group.weight[group] = 0;

      // Second step: should freeze
      state.step(1 / 60);
      expect(Transform.posX[member0]).toBe(-2);
    });
  });

  describe('horizontal arrangement', () => {
    it('should center single member at origin', () => {
      const group = state.createEntity();
      state.addComponent(group, Group);
      Group.gap[group] = 5;
      Group.weight[group] = 1;

      const member = state.createEntity();
      state.addComponent(member, Transform);
      state.addComponent(member, Member);
      Transform.posX[member] = 100;
      Member.group[member] = group;
      Member.index[member] = 0;

      state.step(1 / 60);

      expect(Transform.posX[member]).toBe(0);
      expect(Transform.posY[member]).toBe(0);
      expect(Transform.posZ[member]).toBe(0);
    });

    it('should distribute three members correctly', () => {
      const group = state.createEntity();
      state.addComponent(group, Group);
      Group.gap[group] = 3;
      Group.weight[group] = 1;

      const members = [0, 1, 2].map((i) => {
        const m = state.createEntity();
        state.addComponent(m, Transform);
        state.addComponent(m, Member);
        Transform.posX[m] = 100 + i * 50;
        Member.group[m] = group;
        Member.index[m] = i;
        return m;
      });

      state.step(1 / 60);

      // gap=3, count=3 => positions at -3, 0, 3
      expect(Transform.posX[members[0]]).toBe(-3);
      expect(Transform.posX[members[1]]).toBe(0);
      expect(Transform.posX[members[2]]).toBe(3);
    });

    it('should update positions when gap changes', () => {
      const group = state.createEntity();
      state.addComponent(group, Group);
      Group.gap[group] = 2;
      Group.weight[group] = 1;

      const member0 = state.createEntity();
      state.addComponent(member0, Transform);
      state.addComponent(member0, Member);
      Member.group[member0] = group;
      Member.index[member0] = 0;

      const member1 = state.createEntity();
      state.addComponent(member1, Transform);
      state.addComponent(member1, Member);
      Member.group[member1] = group;
      Member.index[member1] = 1;

      state.step(1 / 60);
      expect(Transform.posX[member0]).toBe(-1);
      expect(Transform.posX[member1]).toBe(1);

      // Change gap
      Group.gap[group] = 6;
      state.step(1 / 60);

      expect(Transform.posX[member0]).toBe(-3);
      expect(Transform.posX[member1]).toBe(3);
    });
  });

  describe('missing components', () => {
    it('should skip members without Transform component', () => {
      const group = state.createEntity();
      state.addComponent(group, Group);
      Group.gap[group] = 4;
      Group.weight[group] = 1;

      const member = state.createEntity();
      state.addComponent(member, Member);
      Member.group[member] = group;
      Member.index[member] = 0;

      // Should not throw
      expect(() => state.step(1 / 60)).not.toThrow();
    });
  });
});
