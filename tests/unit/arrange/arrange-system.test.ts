import { beforeEach, describe, expect, it } from 'bun:test';
import { State } from 'vibegame';
import { Transform, TransformsPlugin } from 'vibegame/transforms';
import {
  Align,
  ArrangePlugin,
  HorizontalGroup,
  HorizontalMember,
} from 'vibegame/arrange';

describe('Horizontal Arrange System', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(ArrangePlugin);
  });

  describe('blend behavior', () => {
    it('should not move members when blend=0', () => {
      const group = state.createEntity();
      state.addComponent(group, HorizontalGroup);
      HorizontalGroup.gap[group] = 5;
      HorizontalGroup.blend[group] = 0;

      const member = state.createEntity();
      state.addComponent(member, Transform);
      state.addComponent(member, HorizontalMember);
      Transform.posX[member] = 10;
      HorizontalMember.group[member] = group;
      HorizontalMember.index[member] = 0;

      state.step(1 / 60);
      expect(Transform.posX[member]).toBe(10);
    });

    it('should arrange members when blend > 0', () => {
      const group = state.createEntity();
      state.addComponent(group, HorizontalGroup);
      HorizontalGroup.gap[group] = 4;
      HorizontalGroup.blend[group] = 1;

      const member0 = state.createEntity();
      state.addComponent(member0, Transform);
      state.addComponent(member0, HorizontalMember);
      Transform.posX[member0] = 100;
      HorizontalMember.group[member0] = group;
      HorizontalMember.index[member0] = 0;

      const member1 = state.createEntity();
      state.addComponent(member1, Transform);
      state.addComponent(member1, HorizontalMember);
      Transform.posX[member1] = 200;
      HorizontalMember.group[member1] = group;
      HorizontalMember.index[member1] = 1;

      state.step(1 / 60);

      expect(Transform.posX[member0]).toBe(-2);
      expect(Transform.posX[member1]).toBe(2);
    });

    it('should freeze position when blend becomes 0', () => {
      const group = state.createEntity();
      state.addComponent(group, HorizontalGroup);
      HorizontalGroup.gap[group] = 4;
      HorizontalGroup.blend[group] = 1;

      const member0 = state.createEntity();
      state.addComponent(member0, Transform);
      state.addComponent(member0, HorizontalMember);
      Transform.posX[member0] = 100;
      HorizontalMember.group[member0] = group;
      HorizontalMember.index[member0] = 0;

      const member1 = state.createEntity();
      state.addComponent(member1, Transform);
      state.addComponent(member1, HorizontalMember);
      HorizontalMember.group[member1] = group;
      HorizontalMember.index[member1] = 1;

      state.step(1 / 60);
      expect(Transform.posX[member0]).toBe(-2);

      HorizontalGroup.blend[group] = 0;

      state.step(1 / 60);
      expect(Transform.posX[member0]).toBe(-2);
    });
  });

  describe('horizontal arrangement', () => {
    it('should center single member at origin', () => {
      const group = state.createEntity();
      state.addComponent(group, HorizontalGroup);
      HorizontalGroup.gap[group] = 5;
      HorizontalGroup.blend[group] = 1;

      const member = state.createEntity();
      state.addComponent(member, Transform);
      state.addComponent(member, HorizontalMember);
      Transform.posX[member] = 100;
      HorizontalMember.group[member] = group;
      HorizontalMember.index[member] = 0;

      state.step(1 / 60);

      expect(Transform.posX[member]).toBe(0);
      expect(Transform.posY[member]).toBe(0);
      expect(Transform.posZ[member]).toBe(0);
    });

    it('should distribute three members correctly', () => {
      const group = state.createEntity();
      state.addComponent(group, HorizontalGroup);
      HorizontalGroup.gap[group] = 3;
      HorizontalGroup.blend[group] = 1;

      const members = [0, 1, 2].map((i) => {
        const m = state.createEntity();
        state.addComponent(m, Transform);
        state.addComponent(m, HorizontalMember);
        Transform.posX[m] = 100 + i * 50;
        HorizontalMember.group[m] = group;
        HorizontalMember.index[m] = i;
        return m;
      });

      state.step(1 / 60);

      expect(Transform.posX[members[0]]).toBe(-3);
      expect(Transform.posX[members[1]]).toBe(0);
      expect(Transform.posX[members[2]]).toBe(3);
    });

    it('should update positions when gap changes', () => {
      const group = state.createEntity();
      state.addComponent(group, HorizontalGroup);
      HorizontalGroup.gap[group] = 2;
      HorizontalGroup.blend[group] = 1;

      const member0 = state.createEntity();
      state.addComponent(member0, Transform);
      state.addComponent(member0, HorizontalMember);
      HorizontalMember.group[member0] = group;
      HorizontalMember.index[member0] = 0;

      const member1 = state.createEntity();
      state.addComponent(member1, Transform);
      state.addComponent(member1, HorizontalMember);
      HorizontalMember.group[member1] = group;
      HorizontalMember.index[member1] = 1;

      state.step(1 / 60);
      expect(Transform.posX[member0]).toBe(-1);
      expect(Transform.posX[member1]).toBe(1);

      HorizontalGroup.gap[group] = 6;
      state.step(1 / 60);

      expect(Transform.posX[member0]).toBe(-3);
      expect(Transform.posX[member1]).toBe(3);
    });
  });

  describe('alignment modes', () => {
    it('should align left when align=Left', () => {
      const group = state.createEntity();
      state.addComponent(group, HorizontalGroup);
      HorizontalGroup.gap[group] = 2;
      HorizontalGroup.align[group] = Align.Left;
      HorizontalGroup.blend[group] = 1;

      const members = [0, 1, 2].map((i) => {
        const m = state.createEntity();
        state.addComponent(m, Transform);
        state.addComponent(m, HorizontalMember);
        HorizontalMember.group[m] = group;
        HorizontalMember.index[m] = i;
        return m;
      });

      state.step(1 / 60);

      expect(Transform.posX[members[0]]).toBe(0);
      expect(Transform.posX[members[1]]).toBe(2);
      expect(Transform.posX[members[2]]).toBe(4);
    });

    it('should align right when align=Right', () => {
      const group = state.createEntity();
      state.addComponent(group, HorizontalGroup);
      HorizontalGroup.gap[group] = 2;
      HorizontalGroup.align[group] = Align.Right;
      HorizontalGroup.blend[group] = 1;

      const members = [0, 1, 2].map((i) => {
        const m = state.createEntity();
        state.addComponent(m, Transform);
        state.addComponent(m, HorizontalMember);
        HorizontalMember.group[m] = group;
        HorizontalMember.index[m] = i;
        return m;
      });

      state.step(1 / 60);

      expect(Transform.posX[members[0]]).toBe(-4);
      expect(Transform.posX[members[1]]).toBe(-2);
      expect(Transform.posX[members[2]]).toBe(0);
    });
  });

  describe('missing components', () => {
    it('should skip members without Transform component', () => {
      const group = state.createEntity();
      state.addComponent(group, HorizontalGroup);
      HorizontalGroup.gap[group] = 4;
      HorizontalGroup.blend[group] = 1;

      const member = state.createEntity();
      state.addComponent(member, HorizontalMember);
      HorizontalMember.group[member] = group;
      HorizontalMember.index[member] = 0;

      expect(() => state.step(1 / 60)).not.toThrow();
    });
  });
});
