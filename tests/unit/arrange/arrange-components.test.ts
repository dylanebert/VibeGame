import { beforeEach, describe, expect, it } from 'bun:test';
import { State } from 'vibegame';
import { TransformsPlugin } from 'vibegame/transforms';
import {
  Align,
  ArrangePlugin,
  HorizontalGroup,
  HorizontalMember,
} from 'vibegame/arrange';

describe('Arrange Components', () => {
  let state: State;

  beforeEach(() => {
    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(ArrangePlugin);
  });

  describe('HorizontalGroup component', () => {
    it('should register HorizontalGroup component', () => {
      const entity = state.createEntity();
      state.addComponent(entity, HorizontalGroup);
      expect(state.hasComponent(entity, HorizontalGroup)).toBe(true);
    });

    it('should have config defaults when added via state', () => {
      const entity = state.createEntity();
      state.addComponent(entity, HorizontalGroup);

      expect(HorizontalGroup.align[entity]).toBe(Align.Center);
      expect(HorizontalGroup.gap[entity]).toBe(1);
      expect(HorizontalGroup.blend[entity]).toBe(1);
    });

    it('should store align value', () => {
      const entity = state.createEntity();
      state.addComponent(entity, HorizontalGroup);
      HorizontalGroup.align[entity] = Align.Right;
      expect(HorizontalGroup.align[entity]).toBe(Align.Right);
    });

    it('should store gap value', () => {
      const entity = state.createEntity();
      state.addComponent(entity, HorizontalGroup);
      HorizontalGroup.gap[entity] = 2.5;
      expect(HorizontalGroup.gap[entity]).toBeCloseTo(2.5);
    });

    it('should store blend value', () => {
      const entity = state.createEntity();
      state.addComponent(entity, HorizontalGroup);
      HorizontalGroup.blend[entity] = 0.75;
      expect(HorizontalGroup.blend[entity]).toBeCloseTo(0.75);
    });
  });

  describe('HorizontalMember component', () => {
    it('should register HorizontalMember component', () => {
      const entity = state.createEntity();
      state.addComponent(entity, HorizontalMember);
      expect(state.hasComponent(entity, HorizontalMember)).toBe(true);
    });

    it('should have default values', () => {
      const entity = state.createEntity();
      state.addComponent(entity, HorizontalMember);

      expect(HorizontalMember.group[entity]).toBe(0);
      expect(HorizontalMember.index[entity]).toBe(0);
    });

    it('should store group reference', () => {
      const groupEntity = state.createEntity();
      state.addComponent(groupEntity, HorizontalGroup);

      const memberEntity = state.createEntity();
      state.addComponent(memberEntity, HorizontalMember);
      HorizontalMember.group[memberEntity] = groupEntity;

      expect(HorizontalMember.group[memberEntity]).toBe(groupEntity);
    });

    it('should store index', () => {
      const entity = state.createEntity();
      state.addComponent(entity, HorizontalMember);
      HorizontalMember.index[entity] = 3;
      expect(HorizontalMember.index[entity]).toBe(3);
    });
  });

  describe('Group-Member relationships', () => {
    it('should establish group-member relationship', () => {
      const groupEntity = state.createEntity();
      state.addComponent(groupEntity, HorizontalGroup);
      HorizontalGroup.gap[groupEntity] = 2;
      HorizontalGroup.blend[groupEntity] = 1;

      const member1 = state.createEntity();
      state.addComponent(member1, HorizontalMember);
      HorizontalMember.group[member1] = groupEntity;
      HorizontalMember.index[member1] = 0;

      const member2 = state.createEntity();
      state.addComponent(member2, HorizontalMember);
      HorizontalMember.group[member2] = groupEntity;
      HorizontalMember.index[member2] = 1;

      const member3 = state.createEntity();
      state.addComponent(member3, HorizontalMember);
      HorizontalMember.group[member3] = groupEntity;
      HorizontalMember.index[member3] = 2;

      expect(HorizontalMember.group[member1]).toBe(groupEntity);
      expect(HorizontalMember.group[member2]).toBe(groupEntity);
      expect(HorizontalMember.group[member3]).toBe(groupEntity);
    });
  });
});
