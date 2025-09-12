import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State, TIME_CONSTANTS, XMLParser, defineQuery } from 'vibegame';
import { DefaultPlugins } from 'vibegame/defaults';
import { initializePhysics } from 'vibegame';
import { Parent, parseXMLToEntities } from 'vibegame';
import { Transform, WorldTransform } from 'vibegame';

describe('E2E: Nested Entity Transform Hierarchy', () => {
  let state: State;

  beforeAll(async () => {
    await initializePhysics();
  });

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();

    for (const plugin of DefaultPlugins) {
      state.registerPlugin(plugin);
    }
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

  it('should move child with parent when parent is tweened', () => {
    const xml = `
      <world>
        <entity transform="pos: 0 1 5">
          <tween target="transform.pos-y" from="1" to="3" duration="2" easing="sine-in-out" loop="ping-pong"></tween>
          <tween target="rotation" from="0 0 0" to="0 360 0" duration="4" easing="linear" loop="loop"></tween>
          <entity transform="pos: 3 0 0"></entity>
        </entity>
      </world>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const entities = defineQuery([Transform])(state.world);
    const parentEntity = entities.find((e) => !state.hasComponent(e, Parent));
    const childEntity = entities.find((e) => state.hasComponent(e, Parent));

    expect(parentEntity).toBeDefined();
    expect(childEntity).toBeDefined();

    if (!parentEntity || !childEntity) return;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);

    expect(Transform.posX[childEntity]).toBe(3);
    expect(Transform.posY[childEntity]).toBe(0);
    expect(Transform.posZ[childEntity]).toBe(0);

    // After first frame, parent has rotated slightly and moved up slightly due to tweens
    // Parent rotation: 1.5 degrees, Parent Y: 1.0003
    // Child should be rotated around parent's origin
    const angleRad = (1.5 * Math.PI) / 180;
    const expectedX = 3 * Math.cos(angleRad);
    const expectedZ = 5 - 3 * Math.sin(angleRad);

    expect(WorldTransform.posX[childEntity]).toBeCloseTo(expectedX, 1);
    expect(WorldTransform.posY[childEntity]).toBeCloseTo(1.0003, 2);
    expect(WorldTransform.posZ[childEntity]).toBeCloseTo(expectedZ, 1);

    state.step(1);

    expect(Transform.posX[childEntity]).toBe(3);
    expect(Transform.posY[childEntity]).toBe(0);
    expect(Transform.posZ[childEntity]).toBe(0);

    // After 1 second, parent at Y=2.03, rotated ~90 degrees
    // Child rotated ~90 degrees around parent
    expect(WorldTransform.posX[childEntity]).toBeCloseTo(0, 0);
    expect(WorldTransform.posY[childEntity]).toBeCloseTo(2, 1);
    expect(WorldTransform.posZ[childEntity]).toBeCloseTo(2, 1);

    state.step(1);

    expect(Transform.posX[childEntity]).toBe(3);
    expect(Transform.posY[childEntity]).toBe(0);
    expect(Transform.posZ[childEntity]).toBe(0);

    // After 2 seconds total, parent at Y=3, rotated 180 degrees
    // Child rotated 180 degrees around parent
    expect(WorldTransform.posX[childEntity]).toBeCloseTo(-3, 1);
    expect(WorldTransform.posY[childEntity]).toBeCloseTo(3, 1);
    expect(WorldTransform.posZ[childEntity]).toBeCloseTo(5, 0);
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
    const firstFrameAngle = (3 * Math.PI) / 180; // ~3 degrees
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
