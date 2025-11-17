import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import {
  State,
  TIME_CONSTANTS,
  XMLParser,
  defineQuery,
  parseXMLToEntities,
} from 'vibegame';
import { DefaultPlugins } from 'vibegame/defaults';
import { Parent, Transform, WorldTransform } from 'vibegame/transforms';

describe('E2E: Nested Entity Transform Hierarchy', () => {
  let state: State;

  beforeEach(async () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();

    for (const plugin of DefaultPlugins) {
      state.registerPlugin(plugin);
    }

    await state.initializePlugins();
  });

  it('should establish parent-child relationship for nested entities', () => {
    const xml = `
      <world>
        <entity transform="pos: 0 0 0">
          <entity transform="pos: 2 0 0"></entity>
        </entity>
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const entities = defineQuery([Transform])(state.world);
    expect(entities.length).toBe(2);

    const childEntity = entities.find((e) => state.hasComponent(e, Parent));
    expect(childEntity).toBeDefined();

    const parentEntity = entities.find((e) => !state.hasComponent(e, Parent));
    expect(parentEntity).toBeDefined();

    if (childEntity && parentEntity) {
      expect(Parent.entity[childEntity]).toBe(parentEntity);
    }
  });

  it('should handle multi-level nested entities', () => {
    const initialEntityCount = defineQuery([Transform])(state.world).length;

    const xml = `
      <world>
        <entity transform="pos: 0 0 0">
          <entity transform="pos: 1 0 0">
            <entity transform="pos: 1 0 0"></entity>
          </entity>
        </entity>
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const allEntities = defineQuery([Transform])(state.world);
    const newEntities = allEntities.slice(initialEntityCount);
    expect(newEntities.length).toBe(3);

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    const worldTransforms = newEntities
      .filter((e) => state.hasComponent(e, WorldTransform))
      .map((e) => ({
        entity: e,
        worldX: WorldTransform.posX[e],
        localX: Transform.posX[e],
        hasParent: state.hasComponent(e, Parent),
      }))
      .sort((a, b) => a.worldX - b.worldX);

    expect(worldTransforms.length).toBe(3);
    expect(worldTransforms[0].worldX).toBe(0);
    expect(worldTransforms[1].worldX).toBe(1);
    expect(worldTransforms[2].worldX).toBe(2);
  });

  it('should rotate child with parent when parent rotates', () => {
    const xml = `
      <world>
        <entity transform="pos: 0 0 0">
          <tween target="rotation" from="0 0 0" to="0 180 0" duration="1"></tween>
          <entity transform="pos: 2 0 0"></entity>
        </entity>
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const entities = defineQuery([Transform])(state.world);
    const childEntity = entities.find((e) => state.hasComponent(e, Parent));

    expect(childEntity).toBeDefined();
    if (!childEntity) return;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    // Parent has already rotated slightly on first frame
    // With 50Hz physics, rotation is 180 * TIME_CONSTANTS.FIXED_TIMESTEP degrees
    const firstFrameAngle =
      (180 * TIME_CONSTANTS.FIXED_TIMESTEP * Math.PI) / 180;
    const firstX = 2 * Math.cos(firstFrameAngle);
    const firstZ = -2 * Math.sin(firstFrameAngle);
    expect(WorldTransform.posX[childEntity]).toBeCloseTo(firstX, 1);
    expect(WorldTransform.posZ[childEntity]).toBeCloseTo(firstZ, 1);

    state.step(0.5);
    // 90 degree rotation
    expect(WorldTransform.posX[childEntity]).toBeCloseTo(0, 0);
    expect(WorldTransform.posZ[childEntity]).toBeCloseTo(-2, 1);

    state.step(0.5);
    // 180 degree rotation
    expect(WorldTransform.posX[childEntity]).toBeCloseTo(-2, 1);
    expect(WorldTransform.posZ[childEntity]).toBeCloseTo(0, 0);
  });
});
