import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, XMLParser, parseXMLToEntities, TIME_CONSTANTS } from 'vibegame';
import { TransformsPlugin } from 'vibegame/transforms';
import { RenderingPlugin } from 'vibegame/rendering';
import { projectToScreen } from '../../../src/cli/projection';

describe('Screen Projection', () => {
  let state: State;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.headless = true;
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(RenderingPlugin);
  });

  it('returns null when no camera exists', () => {
    const xml =
      '<root><entity name="cube" transform="pos: 0 0 -10"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity = entities[0].entity;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const result = projectToScreen(state, entity);
    expect(result).toBeNull();
  });

  it('returns null when entity has no WorldTransform', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const result = projectToScreen(state, 99999);
    expect(result).toBeNull();
  });

  it('projects entity at origin to screen center when camera looks down -Z', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 0 0 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const cubeEid = state.getEntityByName('cube')!;
    const result = projectToScreen(state, cubeEid);

    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(960, 0);
    expect(result!.y).toBeCloseTo(540, 0);
    expect(result!.visible).toBe(true);
  });

  it('projects entity behind camera with visible=false', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 0"></entity><entity name="cube" transform="pos: 0 0 10"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const cubeEid = state.getEntityByName('cube')!;
    const result = projectToScreen(state, cubeEid);

    expect(result).not.toBeNull();
    expect(result!.visible).toBe(false);
    expect(result!.z).toBeGreaterThan(1);
  });

  it('projects off-center entity to offset screen coordinates', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 5 3 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const cubeEid = state.getEntityByName('cube')!;
    const result = projectToScreen(state, cubeEid);

    expect(result).not.toBeNull();
    expect(result!.x).toBeGreaterThan(960);
    expect(result!.y).toBeLessThan(540);
    expect(result!.visible).toBe(true);
  });

  it('respects custom viewport dimensions', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 0 0 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const cubeEid = state.getEntityByName('cube')!;
    const result = projectToScreen(state, cubeEid, { width: 800, height: 600 });

    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(400, 0);
    expect(result!.y).toBeCloseTo(300, 0);
  });

  it('handles orthographic projection', () => {
    const xml =
      '<root><entity name="camera" main-camera="projection: orthographic; ortho-size: 10" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 0 0 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const cubeEid = state.getEntityByName('cube')!;
    const result = projectToScreen(state, cubeEid);

    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(960, 0);
    expect(result!.y).toBeCloseTo(540, 0);
    expect(result!.visible).toBe(true);
  });

  it('returns consistent results across multiple calls', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 2 -1 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const cubeEid = state.getEntityByName('cube')!;
    const result1 = projectToScreen(state, cubeEid);
    const result2 = projectToScreen(state, cubeEid);

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result1!.x).toBe(result2!.x);
    expect(result1!.y).toBe(result2!.y);
    expect(result1!.z).toBe(result2!.z);
  });
});
