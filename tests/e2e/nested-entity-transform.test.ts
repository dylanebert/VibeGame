import { beforeEach, describe, expect, it } from 'bun:test';
import { State, TIME_CONSTANTS } from 'vibegame';
import {
  createHeadlessState,
  parseWorldXml,
  queryEntities,
} from 'vibegame/cli';
import { DefaultPlugins } from 'vibegame/defaults';
import { Parent, Transform, WorldTransform } from 'vibegame/transforms';

describe('E2E: Nested Entity Transform Hierarchy', () => {
  let state: State;

  beforeEach(async () => {
    state = createHeadlessState({ plugins: DefaultPlugins });
    await state.initializePlugins();
  });

  it('should establish parent-child relationship for nested entities', () => {
    const xml = `
      <entity transform="pos: 0 0 0">
        <entity transform="pos: 2 0 0"></entity>
      </entity>
    `;

    parseWorldXml(state, xml);

    const entities = queryEntities(state, 'transform');
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
    const initialEntityCount = queryEntities(state, 'transform').length;

    const xml = `
      <entity transform="pos: 0 0 0">
        <entity transform="pos: 1 0 0">
          <entity transform="pos: 1 0 0"></entity>
        </entity>
      </entity>
    `;

    parseWorldXml(state, xml);

    const allEntities = queryEntities(state, 'transform');
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
      <entity name="parent" transform="pos: 0 0 0">
        <entity transform="pos: 2 0 0"></entity>
      </entity>
      <tween target="parent" attr="rotation" from="0 0 0" to="0 180 0" duration="1"></tween>
    `;

    parseWorldXml(state, xml);

    const entities = queryEntities(state, 'transform');
    const childEntity = entities.find((e) => state.hasComponent(e, Parent));

    expect(childEntity).toBeDefined();
    if (!childEntity) return;

    state.step(TIME_CONSTANTS.FIXED_TIMESTEP);
    const firstFrameAngle =
      (180 * TIME_CONSTANTS.FIXED_TIMESTEP * Math.PI) / 180;
    const firstX = 2 * Math.cos(firstFrameAngle);
    const firstZ = -2 * Math.sin(firstFrameAngle);
    expect(WorldTransform.posX[childEntity]).toBeCloseTo(firstX, 1);
    expect(WorldTransform.posZ[childEntity]).toBeCloseTo(firstZ, 1);

    state.step(0.5);
    expect(WorldTransform.posX[childEntity]).toBeCloseTo(0, 0);
    expect(WorldTransform.posZ[childEntity]).toBeCloseTo(-2, 1);

    state.step(0.5);
    expect(WorldTransform.posX[childEntity]).toBeCloseTo(-2, 1);
    expect(WorldTransform.posZ[childEntity]).toBeCloseTo(0, 0);
  });
});
