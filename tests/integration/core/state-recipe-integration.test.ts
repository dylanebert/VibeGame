import { defineComponent, Types } from 'bitecs';
import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { State } from 'vibegame';
import { TransformsPlugin } from 'vibegame/transforms';
import { PhysicsPlugin } from 'vibegame/physics';

describe('State Recipe Integration', () => {
  let state: State;

  beforeEach(async () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(PhysicsPlugin);

    await state.initializePlugins();
  });

  it('should create physics entity using state.createFromRecipe', () => {
    state.registerRecipe({
      name: 'physics-box',
      components: ['transform', 'body', 'collider'],
      overrides: {
        'body.type': 1,
      },
    });

    const entity = state.createFromRecipe('physics-box', {
      pos: '5 10 15',
      size: '2 2 2',
    });

    expect(state.exists(entity)).toBe(true);

    const Transform = state.getComponent('transform');
    const Body = state.getComponent('body');
    const Collider = state.getComponent('collider');

    expect(state.hasComponent(entity, Transform!)).toBe(true);
    expect(state.hasComponent(entity, Body!)).toBe(true);
    expect(state.hasComponent(entity, Collider!)).toBe(true);

    expect((Transform as any).posX[entity]).toBe(5);
    expect((Transform as any).posY[entity]).toBe(10);
    expect((Transform as any).posZ[entity]).toBe(15);

    expect((Body as any).type[entity]).toBe(1);

    expect((Collider as any).sizeX[entity]).toBe(2);
    expect((Collider as any).sizeY[entity]).toBe(2);
    expect((Collider as any).sizeZ[entity]).toBe(2);
  });

  it('should work with both imperative and XML methods', () => {
    const entity1 = state.createFromRecipe('entity', {
      transform: 'pos: 1 2 3',
    });

    const { parseXMLToEntities } = require('vibegame');
    const { XMLParser } = require('vibegame');

    const xml = '<root><entity transform="pos: 1 2 3"></entity></root>';
    const parsed = XMLParser.parse(xml);
    const entities = parseXMLToEntities(state, parsed.root);
    const entity2 = entities[0].entity;

    const Transform = state.getComponent('transform');

    expect(state.hasComponent(entity1, Transform!)).toBe(true);
    expect(state.hasComponent(entity2, Transform!)).toBe(true);

    expect((Transform as any).posX[entity1]).toBe(1);
    expect((Transform as any).posX[entity2]).toBe(1);
    expect((Transform as any).posY[entity1]).toBe(2);
    expect((Transform as any).posY[entity2]).toBe(2);
    expect((Transform as any).posZ[entity1]).toBe(3);
    expect((Transform as any).posZ[entity2]).toBe(3);
  });

  it('should work with custom components registered after State creation', () => {
    const CustomComponent = defineComponent({
      value: Types.f32,
      name: Types.ui8,
    });

    state.registerComponent('custom', CustomComponent);
    state.registerRecipe({
      name: 'custom-entity',
      components: ['custom'],
    });

    const entity = state.createFromRecipe('custom-entity', {
      custom: 'value: 42; name: 1',
    });

    expect(state.hasComponent(entity, CustomComponent)).toBe(true);
    expect(CustomComponent.value[entity]).toBe(42);
    expect(CustomComponent.name[entity]).toBe(1);
  });
});
