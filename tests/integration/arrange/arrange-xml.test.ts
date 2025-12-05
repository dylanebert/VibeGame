import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { defineQuery, parseXMLToEntities, State, XMLParser } from 'vibegame';
import { ArrangePlugin, Group, Member } from 'vibegame/arrange';
import { Transform, TransformsPlugin } from 'vibegame/transforms';

describe('Arrange XML Integration', () => {
  let state: State;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(ArrangePlugin);
  });

  describe('reference pattern', () => {
    it('should create group and members from entity references', () => {
      const xml = `
        <world>
          <entity name="row" group="gap: 3; weight: 1"></entity>
          <entity name="a" transform="" member="group: row; index: 0"></entity>
          <entity name="b" transform="" member="group: row; index: 1"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      const groups = defineQuery([Group])(state.world);
      expect(groups.length).toBe(1);
      expect(Group.gap[groups[0]]).toBe(3);
      expect(Group.weight[groups[0]]).toBe(1);

      const members = defineQuery([Member])(state.world);
      expect(members.length).toBe(2);

      for (const member of members) {
        expect(Member.group[member]).toBe(groups[0]);
        expect(state.hasComponent(member, Transform)).toBe(true);
      }
    });

    it('should apply defaults for group', () => {
      const xml = `
        <world>
          <entity name="row" group=""></entity>
          <entity transform="" member="group: row; index: 0"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      const groups = defineQuery([Group])(state.world);
      expect(groups.length).toBe(1);
      expect(Group.weight[groups[0]]).toBe(1);
      expect(Group.gap[groups[0]]).toBe(1);
    });
  });

  describe('system integration', () => {
    it('should arrange members horizontally on step', () => {
      const xml = `
        <world>
          <entity name="row" group="gap: 4; weight: 1"></entity>
          <entity name="a" transform="" member="group: row; index: 0"></entity>
          <entity name="b" transform="" member="group: row; index: 1"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      state.step(1 / 60);

      const members = defineQuery([Member])(state.world);
      const sorted = members.sort((a, b) => Member.index[a] - Member.index[b]);

      expect(Transform.posX[sorted[0]]).toBe(-2);
      expect(Transform.posX[sorted[1]]).toBe(2);
    });

    it('should center three members correctly', () => {
      const xml = `
        <world>
          <entity name="row" group="gap: 3; weight: 1"></entity>
          <entity transform="" member="group: row; index: 0"></entity>
          <entity transform="" member="group: row; index: 1"></entity>
          <entity transform="" member="group: row; index: 2"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      state.step(1 / 60);

      const members = defineQuery([Member])(state.world);
      const sorted = members.sort((a, b) => Member.index[a] - Member.index[b]);

      expect(Transform.posX[sorted[0]]).toBe(-3);
      expect(Transform.posX[sorted[1]]).toBe(0);
      expect(Transform.posX[sorted[2]]).toBe(3);
    });

    it('should not arrange when weight is 0', () => {
      const xml = `
        <world>
          <entity name="row" group="gap: 10; weight: 0"></entity>
          <entity transform="pos: 100 0 0" member="group: row; index: 0"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      state.step(1 / 60);

      const members = defineQuery([Member])(state.world);
      expect(Transform.posX[members[0]]).toBe(100);
    });

    it('should respond to dynamic gap changes', () => {
      const xml = `
        <world>
          <entity name="row" group="gap: 2; weight: 1"></entity>
          <entity transform="" member="group: row; index: 0"></entity>
          <entity transform="" member="group: row; index: 1"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      state.step(1 / 60);

      const members = defineQuery([Member])(state.world);
      const sorted = members.sort((a, b) => Member.index[a] - Member.index[b]);

      expect(Transform.posX[sorted[0]]).toBe(-1);
      expect(Transform.posX[sorted[1]]).toBe(1);

      const groups = defineQuery([Group])(state.world);
      Group.gap[groups[0]] = 10;

      state.step(1 / 60);

      expect(Transform.posX[sorted[0]]).toBe(-5);
      expect(Transform.posX[sorted[1]]).toBe(5);
    });
  });
});
