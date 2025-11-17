import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, TIME_CONSTANTS, XMLParser, parseXMLToEntities } from 'vibegame';
import {
  TransformsPlugin,
  Transform,
  WorldTransform,
  Parent,
} from 'vibegame/transforms';

describe('Transform XML Behavior', () => {
  let state: State;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(TransformsPlugin);
  });

  it('should parse position from XML', () => {
    const xml = '<root><entity transform="pos: 10 20 30"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);
    expect(Transform.posX[entity]).toBe(10);
    expect(Transform.posY[entity]).toBe(20);
    expect(Transform.posZ[entity]).toBe(30);
  });

  it('should parse euler rotation from XML', () => {
    const xml = '<root><entity transform="euler: 45 90 135"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);
    expect(Transform.eulerX[entity]).toBe(45);
    expect(Transform.eulerY[entity]).toBe(90);
    expect(Transform.eulerZ[entity]).toBe(135);
  });

  it('should parse scale from XML', () => {
    const xml = '<root><entity transform="scale: 2 3 4"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);
    expect(Transform.scaleX[entity]).toBe(2);
    expect(Transform.scaleY[entity]).toBe(3);
    expect(Transform.scaleZ[entity]).toBe(4);
  });

  it('should broadcast single scale value to all axes', () => {
    const xml = '<root><entity transform="scale: 2.5"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);
    expect(Transform.scaleX[entity]).toBe(2.5);
    expect(Transform.scaleY[entity]).toBe(2.5);
    expect(Transform.scaleZ[entity]).toBe(2.5);
  });

  it('should parse combined transform properties', () => {
    const xml =
      '<root><entity transform="pos: 5 10 15; euler: 30 60 90; scale: 2"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);
    expect(Transform.posX[entity]).toBe(5);
    expect(Transform.posY[entity]).toBe(10);
    expect(Transform.posZ[entity]).toBe(15);
    expect(Transform.eulerX[entity]).toBe(30);
    expect(Transform.eulerY[entity]).toBe(60);
    expect(Transform.eulerZ[entity]).toBe(90);
    expect(Transform.scaleX[entity]).toBe(2);
    expect(Transform.scaleY[entity]).toBe(2);
    expect(Transform.scaleZ[entity]).toBe(2);
  });

  it('should handle rotation as alias for euler', () => {
    const xml = '<root><entity transform="rotation: 15 30 45"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);
    expect(Transform.eulerX[entity]).toBe(15);
    expect(Transform.eulerY[entity]).toBe(30);
    expect(Transform.eulerZ[entity]).toBe(45);
  });

  it('should convert euler to quaternion automatically', () => {
    const xml = '<root><entity transform="euler: 0 90 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(Transform.rotX[entity]).toBeCloseTo(0, 5);
    expect(Transform.rotY[entity]).toBeCloseTo(0.7071, 3);
    expect(Transform.rotZ[entity]).toBeCloseTo(0, 5);
    expect(Transform.rotW[entity]).toBeCloseTo(0.7071, 3);
  });

  it('should apply default transform values', () => {
    const xml = '<root><entity transform=""></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);
    expect(Transform.posX[entity]).toBe(0);
    expect(Transform.posY[entity]).toBe(0);
    expect(Transform.posZ[entity]).toBe(0);
    expect(Transform.rotX[entity]).toBe(0);
    expect(Transform.rotY[entity]).toBe(0);
    expect(Transform.rotZ[entity]).toBe(0);
    expect(Transform.rotW[entity]).toBe(1);
    expect(Transform.scaleX[entity]).toBe(1);
    expect(Transform.scaleY[entity]).toBe(1);
    expect(Transform.scaleZ[entity]).toBe(1);
  });

  it('should warn about world-transform being read-only', () => {
    const consoleWarnSpy = console.warn;
    let warning = '';
    console.warn = (msg: string) => {
      warning = msg;
    };

    const xml =
      '<root><entity world-transform="pos: 10 20 30"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    expect(warning).toContain('"world-transform" is read-only');
    expect(warning).toContain('Use "transform" for local transforms');

    console.warn = consoleWarnSpy;
  });

  it('should create parent-child hierarchy from nested XML', () => {
    const xml = `
      <root>
        <entity transform="pos: 10 0 0">
          <entity transform="pos: 5 0 0"></entity>
        </entity>
      </root>
    `;
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);

    const parentEntity = entities[0].entity;
    const childEntity = entities[0].children[0].entity;

    expect(state.hasComponent(parentEntity, Transform)).toBe(true);
    expect(state.hasComponent(childEntity, Transform)).toBe(true);
    expect(state.hasComponent(childEntity, Parent)).toBe(true);
    expect(Parent.entity[childEntity]).toBe(parentEntity);

    expect(Transform.posX[parentEntity]).toBe(10);
    expect(Transform.posX[childEntity]).toBe(5);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(WorldTransform.posX[parentEntity]).toBe(10);
    expect(WorldTransform.posX[childEntity]).toBe(15);
  });

  it('should handle multi-level hierarchy from XML', () => {
    const xml = `
      <root>
        <entity transform="pos: 10 0 0; scale: 2">
          <entity transform="pos: 5 0 0; scale: 0.5">
            <entity transform="pos: 2 0 0; scale: 2"></entity>
          </entity>
        </entity>
      </root>
    `;
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);

    const grandparent = entities[0].entity;
    const parent = entities[0].children[0].entity;
    const child = entities[0].children[0].children[0].entity;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(WorldTransform.posX[grandparent]).toBe(10);
    expect(WorldTransform.scaleX[grandparent]).toBe(2);

    expect(WorldTransform.posX[parent]).toBe(20);
    expect(WorldTransform.scaleX[parent]).toBe(1);

    expect(WorldTransform.posX[child]).toBe(22);
    expect(WorldTransform.scaleX[child]).toBe(2);
  });

  it('should parse transform using dot notation', () => {
    state.registerRecipe({
      name: 'entity',
      components: ['transform'],
    });

    const xml =
      '<root><entity transform.posX="15" transform.eulerY="45"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);
    expect(Transform.posX[entity]).toBe(15);
    expect(Transform.posY[entity]).toBe(0);
    expect(Transform.eulerY[entity]).toBe(45);
  });

  it('should handle negative values in transforms', () => {
    const xml =
      '<root><entity transform="pos: -10 -20 -30; euler: -45 -90 -135"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(Transform.posX[entity]).toBe(-10);
    expect(Transform.posY[entity]).toBe(-20);
    expect(Transform.posZ[entity]).toBe(-30);
    expect(Transform.eulerX[entity]).toBe(-45);
    expect(Transform.eulerY[entity]).toBe(-90);
    expect(Transform.eulerZ[entity]).toBe(-135);
  });

  it('should handle decimal values in transforms', () => {
    const xml =
      '<root><entity transform="pos: 1.5 2.75 3.125; scale: 0.5 1.25 2.5"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(Transform.posX[entity]).toBe(1.5);
    expect(Transform.posY[entity]).toBe(2.75);
    expect(Transform.posZ[entity]).toBe(3.125);
    expect(Transform.scaleX[entity]).toBe(0.5);
    expect(Transform.scaleY[entity]).toBe(1.25);
    expect(Transform.scaleZ[entity]).toBe(2.5);
  });

  it('should handle zero values in transforms', () => {
    const xml =
      '<root><entity transform="pos: 0 0 0; euler: 0 0 0; scale: 0 0 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(Transform.posX[entity]).toBe(0);
    expect(Transform.posY[entity]).toBe(0);
    expect(Transform.posZ[entity]).toBe(0);
    expect(Transform.eulerX[entity]).toBe(0);
    expect(Transform.eulerY[entity]).toBe(0);
    expect(Transform.eulerZ[entity]).toBe(0);
    expect(Transform.scaleX[entity]).toBe(0);
    expect(Transform.scaleY[entity]).toBe(0);
    expect(Transform.scaleZ[entity]).toBe(0);
  });

  it('should create transform with partial properties', () => {
    const xml = '<root><entity transform="pos: 5 10 15"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(Transform.posX[entity]).toBe(5);
    expect(Transform.posY[entity]).toBe(10);
    expect(Transform.posZ[entity]).toBe(15);
    expect(Transform.rotW[entity]).toBe(1);
    expect(Transform.scaleX[entity]).toBe(1);
    expect(Transform.scaleY[entity]).toBe(1);
    expect(Transform.scaleZ[entity]).toBe(1);
  });

  it('should handle transforms with only rotation', () => {
    const xml = '<root><entity transform="rotation: 45 0 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    expect(Transform.posX[entity]).toBe(0);
    expect(Transform.posY[entity]).toBe(0);
    expect(Transform.posZ[entity]).toBe(0);
    expect(Transform.eulerX[entity]).toBe(45);
    expect(Transform.eulerY[entity]).toBe(0);
    expect(Transform.eulerZ[entity]).toBe(0);
    expect(Transform.scaleX[entity]).toBe(1);
    expect(Transform.scaleY[entity]).toBe(1);
    expect(Transform.scaleZ[entity]).toBe(1);
  });
});
