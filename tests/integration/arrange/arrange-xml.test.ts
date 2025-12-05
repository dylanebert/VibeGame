import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { defineQuery, parseXMLToEntities, State, XMLParser } from 'vibegame';
import {
  Align,
  ArrangePlugin,
  HorizontalGroup,
  HorizontalMember,
} from 'vibegame/arrange';
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
          <entity name="row" horizontal-group="gap: 3; blend: 1"></entity>
          <entity name="a" transform="" horizontal-member="group: row; index: 0"></entity>
          <entity name="b" transform="" horizontal-member="group: row; index: 1"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      const groups = defineQuery([HorizontalGroup])(state.world);
      expect(groups.length).toBe(1);
      expect(HorizontalGroup.gap[groups[0]]).toBe(3);
      expect(HorizontalGroup.blend[groups[0]]).toBe(1);

      const members = defineQuery([HorizontalMember])(state.world);
      expect(members.length).toBe(2);

      for (const member of members) {
        expect(HorizontalMember.group[member]).toBe(groups[0]);
        expect(state.hasComponent(member, Transform)).toBe(true);
      }
    });

    it('should apply defaults for horizontal-group', () => {
      const xml = `
        <world>
          <entity name="row" horizontal-group=""></entity>
          <entity transform="" horizontal-member="group: row; index: 0"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      const groups = defineQuery([HorizontalGroup])(state.world);
      expect(groups.length).toBe(1);
      expect(HorizontalGroup.blend[groups[0]]).toBe(1);
      expect(HorizontalGroup.gap[groups[0]]).toBe(1);
      expect(HorizontalGroup.align[groups[0]]).toBe(Align.Center);
    });
  });

  describe('system integration', () => {
    it('should arrange members horizontally on step', () => {
      const xml = `
        <world>
          <entity name="row" horizontal-group="gap: 4; blend: 1"></entity>
          <entity name="a" transform="" horizontal-member="group: row; index: 0"></entity>
          <entity name="b" transform="" horizontal-member="group: row; index: 1"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      state.step(1 / 60);

      const members = defineQuery([HorizontalMember])(state.world);
      const sorted = members.sort(
        (a, b) => HorizontalMember.index[a] - HorizontalMember.index[b]
      );

      expect(Transform.posX[sorted[0]]).toBe(-2);
      expect(Transform.posX[sorted[1]]).toBe(2);
    });

    it('should center three members correctly', () => {
      const xml = `
        <world>
          <entity name="row" horizontal-group="gap: 3; blend: 1"></entity>
          <entity transform="" horizontal-member="group: row; index: 0"></entity>
          <entity transform="" horizontal-member="group: row; index: 1"></entity>
          <entity transform="" horizontal-member="group: row; index: 2"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      state.step(1 / 60);

      const members = defineQuery([HorizontalMember])(state.world);
      const sorted = members.sort(
        (a, b) => HorizontalMember.index[a] - HorizontalMember.index[b]
      );

      expect(Transform.posX[sorted[0]]).toBe(-3);
      expect(Transform.posX[sorted[1]]).toBe(0);
      expect(Transform.posX[sorted[2]]).toBe(3);
    });

    it('should not arrange when blend is 0', () => {
      const xml = `
        <world>
          <entity name="row" horizontal-group="gap: 10; blend: 0"></entity>
          <entity transform="pos: 100 0 0" horizontal-member="group: row; index: 0"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      state.step(1 / 60);

      const members = defineQuery([HorizontalMember])(state.world);
      expect(Transform.posX[members[0]]).toBe(100);
    });

    it('should respond to dynamic gap changes', () => {
      const xml = `
        <world>
          <entity name="row" horizontal-group="gap: 2; blend: 1"></entity>
          <entity transform="" horizontal-member="group: row; index: 0"></entity>
          <entity transform="" horizontal-member="group: row; index: 1"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      state.step(1 / 60);

      const members = defineQuery([HorizontalMember])(state.world);
      const sorted = members.sort(
        (a, b) => HorizontalMember.index[a] - HorizontalMember.index[b]
      );

      expect(Transform.posX[sorted[0]]).toBe(-1);
      expect(Transform.posX[sorted[1]]).toBe(1);

      const groups = defineQuery([HorizontalGroup])(state.world);
      HorizontalGroup.gap[groups[0]] = 10;

      state.step(1 / 60);

      expect(Transform.posX[sorted[0]]).toBe(-5);
      expect(Transform.posX[sorted[1]]).toBe(5);
    });
  });

  describe('alignment modes via XML', () => {
    it('should support align: left via XML', () => {
      const xml = `
        <world>
          <entity name="row" horizontal-group="gap: 2; align: left; blend: 1"></entity>
          <entity transform="" horizontal-member="group: row; index: 0"></entity>
          <entity transform="" horizontal-member="group: row; index: 1"></entity>
          <entity transform="" horizontal-member="group: row; index: 2"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      state.step(1 / 60);

      const members = defineQuery([HorizontalMember])(state.world);
      const sorted = members.sort(
        (a, b) => HorizontalMember.index[a] - HorizontalMember.index[b]
      );

      expect(Transform.posX[sorted[0]]).toBe(0);
      expect(Transform.posX[sorted[1]]).toBe(2);
      expect(Transform.posX[sorted[2]]).toBe(4);
    });

    it('should support align: right via XML', () => {
      const xml = `
        <world>
          <entity name="row" horizontal-group="gap: 2; align: right; blend: 1"></entity>
          <entity transform="" horizontal-member="group: row; index: 0"></entity>
          <entity transform="" horizontal-member="group: row; index: 1"></entity>
          <entity transform="" horizontal-member="group: row; index: 2"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      state.step(1 / 60);

      const members = defineQuery([HorizontalMember])(state.world);
      const sorted = members.sort(
        (a, b) => HorizontalMember.index[a] - HorizontalMember.index[b]
      );

      expect(Transform.posX[sorted[0]]).toBe(-4);
      expect(Transform.posX[sorted[1]]).toBe(-2);
      expect(Transform.posX[sorted[2]]).toBe(0);
    });

    it('should support align: center via XML', () => {
      const xml = `
        <world>
          <entity name="row" horizontal-group="gap: 2; align: center; blend: 1"></entity>
          <entity transform="" horizontal-member="group: row; index: 0"></entity>
          <entity transform="" horizontal-member="group: row; index: 1"></entity>
        </world>
      `;

      const parsed = XMLParser.parse(xml);
      parseXMLToEntities(state, parsed.root);

      state.step(1 / 60);

      const members = defineQuery([HorizontalMember])(state.world);
      const sorted = members.sort(
        (a, b) => HorizontalMember.index[a] - HorizontalMember.index[b]
      );

      expect(Transform.posX[sorted[0]]).toBe(-1);
      expect(Transform.posX[sorted[1]]).toBe(1);
    });
  });
});
