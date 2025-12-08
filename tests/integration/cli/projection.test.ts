import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, XMLParser, parseXMLToEntities, TIME_CONSTANTS } from 'vibegame';
import { TransformsPlugin } from 'vibegame/transforms';
import { RenderingPlugin } from 'vibegame/rendering';
import { createSnapshot } from '../../../src/cli/snapshot';

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

  it('throws when no camera exists and project is true', () => {
    const xml =
      '<root><entity name="cube" transform="pos: 0 0 -10"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(() => createSnapshot(state, { entities: ['cube'] })).toThrow(
      'No camera found'
    );
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
    expect(snapshot.entities[0].screen).toBeUndefined();
  });

  it('skips screen coords for entity without WorldTransform', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity><entity name="noTransform" main-camera=""></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    // Entity has MainCamera component but no transform, so no WorldTransform
    const snapshot = createSnapshot(state, {
      entities: ['noTransform'],
      project: false,
    });
    const noTransform = snapshot.entities.find((e) => e.name === 'noTransform');
    expect(noTransform).toBeDefined();
    // Without project, no screen coords
    expect(noTransform!.screen).toBeUndefined();
  });

  it('projects entity at origin to screen center when camera looks down -Z', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 0 0 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const snapshot = createSnapshot(state, { entities: ['cube'] });
    const cube = snapshot.entities.find((e) => e.name === 'cube')!;

    expect(cube.screen).toBeDefined();
    expect(cube.screen!.x).toBeCloseTo(960, 0);
    expect(cube.screen!.y).toBeCloseTo(540, 0);
    expect(cube.screen!.visible).toBe(true);
  });

  it('projects entity behind camera with visible=false', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 0"></entity><entity name="cube" transform="pos: 0 0 10"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const snapshot = createSnapshot(state, { entities: ['cube'] });
    const cube = snapshot.entities.find((e) => e.name === 'cube')!;

    expect(cube.screen).toBeDefined();
    expect(cube.screen!.visible).toBe(false);
    expect(cube.screen!.z).toBeGreaterThan(1);
  });

  it('projects off-center entity to offset screen coordinates', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 5 3 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const snapshot = createSnapshot(state, { entities: ['cube'] });
    const cube = snapshot.entities.find((e) => e.name === 'cube')!;

    expect(cube.screen).toBeDefined();
    expect(cube.screen!.x).toBeGreaterThan(960);
    expect(cube.screen!.y).toBeLessThan(540);
    expect(cube.screen!.visible).toBe(true);
  });

  it('respects custom viewport dimensions', () => {
    const xml =
      '<root><entity name="camera" main-camera="" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 0 0 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const snapshot = createSnapshot(state, {
      entities: ['cube'],
      viewport: { width: 800, height: 600 },
    });
    const cube = snapshot.entities.find((e) => e.name === 'cube')!;

    expect(cube.screen).toBeDefined();
    expect(cube.screen!.x).toBeCloseTo(400, 0);
    expect(cube.screen!.y).toBeCloseTo(300, 0);
  });

  it('handles orthographic projection', () => {
    const xml =
      '<root><entity name="camera" main-camera="projection: orthographic; ortho-size: 10" transform="pos: 0 0 10"></entity><entity name="cube" transform="pos: 0 0 0"></entity></root>';
    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const snapshot = createSnapshot(state, { entities: ['cube'] });
    const cube = snapshot.entities.find((e) => e.name === 'cube')!;

    expect(cube.screen).toBeDefined();
    expect(cube.screen!.x).toBeCloseTo(960, 0);
    expect(cube.screen!.y).toBeCloseTo(540, 0);
    expect(cube.screen!.visible).toBe(true);
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

    expect(cube1.screen).toBeDefined();
    expect(cube2.screen).toBeDefined();
    expect(cube1.screen!.x).toBe(cube2.screen!.x);
    expect(cube1.screen!.y).toBe(cube2.screen!.y);
    expect(cube1.screen!.z).toBe(cube2.screen!.z);
  });
});
