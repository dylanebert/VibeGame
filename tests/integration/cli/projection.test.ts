import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, XMLParser, parseXMLToEntities, TIME_CONSTANTS } from 'vibegame';
import { TransformsPlugin } from 'vibegame/transforms';
import { RenderingPlugin } from 'vibegame/rendering';
import { createSnapshot } from '../../../src/cli/snapshot';

describe('Viewport Projection', () => {
  let state: State;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.headless = true;
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(RenderingPlugin);
  });

  it('skips viewport projection gracefully when no camera exists', () => {
    const xml =
      '<root><entity name="cube" transform="pos: 0 0 -10"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const snapshot = createSnapshot(state, { entities: ['cube'] });
    expect(snapshot.entities).toHaveLength(1);
    expect(snapshot.entities[0].viewport).toBeUndefined();
  });

  it('succeeds without camera when project is false', () => {
    const xml =
      '<root><entity name="cube" transform="pos: 0 0 -10"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const snapshot = createSnapshot(state, {
      entities: ['cube'],
      project: false,
    });
    expect(snapshot.entities).toHaveLength(1);
    expect(snapshot.entities[0].viewport).toBeUndefined();
  });

  it('skips viewport coords for entity without WorldTransform', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity><entity name="noTransform" main-camera=""></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const snapshot = createSnapshot(state, {
      entities: ['noTransform'],
      project: false,
    });
    const noTransform = snapshot.entities.find((e) => e.name === 'noTransform');
    expect(noTransform).toBeDefined();
    expect(noTransform!.viewport).toBeUndefined();
  });

  it('projects entity at origin to viewport center when camera looks down -Z', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 0 0 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const snapshot = createSnapshot(state, { entities: ['cube'] });
    const cube = snapshot.entities.find((e) => e.name === 'cube')!;

    expect(cube.viewport).toBeDefined();
    expect(cube.viewport!.x).toBeCloseTo(0.5, 3);
    expect(cube.viewport!.y).toBeCloseTo(0.5, 3);
    expect(cube.viewport!.visible).toBe(true);
  });

  it('projects entity behind camera with visible=false', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 0"></entity><entity name="cube" transform="pos: 0 0 10"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const snapshot = createSnapshot(state, { entities: ['cube'] });
    const cube = snapshot.entities.find((e) => e.name === 'cube')!;

    expect(cube.viewport).toBeDefined();
    expect(cube.viewport!.visible).toBe(false);
    expect(cube.viewport!.z).toBeGreaterThan(1);
  });

  it('projects off-center entity to offset viewport coordinates', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 5 3 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const snapshot = createSnapshot(state, { entities: ['cube'] });
    const cube = snapshot.entities.find((e) => e.name === 'cube')!;

    expect(cube.viewport).toBeDefined();
    expect(cube.viewport!.x).toBeGreaterThan(0.5);
    expect(cube.viewport!.y).toBeLessThan(0.5);
    expect(cube.viewport!.visible).toBe(true);
  });

  it('handles orthographic projection', () => {
    const xml =
      '<root><entity name="camera" main-camera="projection: orthographic; ortho-size: 10" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 0 0 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const snapshot = createSnapshot(state, { entities: ['cube'] });
    const cube = snapshot.entities.find((e) => e.name === 'cube')!;

    expect(cube.viewport).toBeDefined();
    expect(cube.viewport!.x).toBeCloseTo(0.5, 3);
    expect(cube.viewport!.y).toBeCloseTo(0.5, 3);
    expect(cube.viewport!.visible).toBe(true);
  });

  it('returns consistent results across multiple calls', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 2 -1 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const snapshot1 = createSnapshot(state, { entities: ['cube'] });
    const snapshot2 = createSnapshot(state, { entities: ['cube'] });

    const cube1 = snapshot1.entities.find((e) => e.name === 'cube')!;
    const cube2 = snapshot2.entities.find((e) => e.name === 'cube')!;

    expect(cube1.viewport).toBeDefined();
    expect(cube2.viewport).toBeDefined();
    expect(cube1.viewport!.x).toBe(cube2.viewport!.x);
    expect(cube1.viewport!.y).toBe(cube2.viewport!.y);
    expect(cube1.viewport!.z).toBe(cube2.viewport!.z);
  });
});
