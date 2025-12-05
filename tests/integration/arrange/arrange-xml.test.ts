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

  describe('XML parsing', () => {
    it('should create group from arrange tag', () => {
      const xml = `
        <world>
          <arrange name="row" strategy="horizontal" gap="3" weight="1">
            <entity name="a" transform=""></entity>
            <entity name="b" transform=""></entity>
          </arrange>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      const groups = defineQuery([Group])(state.world);
      expect(groups.length).toBe(1);

      const groupEntity = groups[0];
      expect(Group.gap[groupEntity]).toBe(3);
      expect(Group.weight[groupEntity]).toBe(1);
      expect(Group.count[groupEntity]).toBe(2);
    });

    it('should create members for child entities', () => {
      const xml = `
        <world>
          <arrange name="row" gap="5" weight="1">
            <entity name="first" transform=""></entity>
            <entity name="second" transform=""></entity>
            <entity name="third" transform=""></entity>
          </arrange>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      const members = defineQuery([Member])(state.world);
      expect(members.length).toBe(3);

      const groups = defineQuery([Group])(state.world);
      const groupEntity = groups[0];

      for (const member of members) {
        expect(Member.group[member]).toBe(groupEntity);
        expect(state.hasComponent(member, Transform)).toBe(true);
      }

      const indices = members.map((m) => Member.index[m]).sort();
      expect(indices).toEqual([0, 1, 2]);
    });

    it('should apply defaults when attributes not specified', () => {
      const xml = `
        <world>
          <arrange>
            <entity transform=""></entity>
          </arrange>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      const groups = defineQuery([Group])(state.world);
      expect(groups.length).toBe(1);

      const groupEntity = groups[0];
      expect(Group.weight[groupEntity]).toBe(1);
      expect(Group.gap[groupEntity]).toBe(1);
    });
  });

  describe('system integration', () => {
    it('should arrange members horizontally on step', () => {
      const xml = `
        <world>
          <arrange name="row" strategy="horizontal" gap="4" weight="1">
            <entity name="a" transform=""></entity>
            <entity name="b" transform=""></entity>
          </arrange>
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
          <arrange gap="3" weight="1">
            <entity transform=""></entity>
            <entity transform=""></entity>
            <entity transform=""></entity>
          </arrange>
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
          <arrange gap="10" weight="0">
            <entity transform="pos: 100 0 0"></entity>
          </arrange>
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
          <arrange name="row" gap="2" weight="1">
            <entity transform=""></entity>
            <entity transform=""></entity>
          </arrange>
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
