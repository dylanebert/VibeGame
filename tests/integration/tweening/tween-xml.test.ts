import { State, XMLParser, defineQuery } from 'vibegame';
import { parseXMLToEntities, RecipePlugin } from 'vibegame';
import { Transform, TransformsPlugin, WorldTransform } from 'vibegame';
import { Tween, TweenPlugin, TweenValue } from 'vibegame';
import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { defineComponent, Types } from 'bitecs';

describe('Tween XML Integration', () => {
  let state: State;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(RecipePlugin);
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(TweenPlugin);
  });

  it('should create tween from XML', () => {
    const xml = `
      <root>
        <entity transform="pos: 0 0 0">
          <tween target="transform.pos-x" to="10" duration="2"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);

    expect(results.length).toBe(1);
    const entity = results[0].entity;

    expect(state.hasComponent(entity, Transform)).toBe(true);

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBeGreaterThan(0);

    const tweenEntity = tweens[0];
    expect(Tween.duration[tweenEntity]).toBe(2);
  });

  it('should animate entity from XML tween', () => {
    const xml = `
      <root>
        <entity transform="pos: 0 0 0">
          <tween target="transform.pos-x" from="0" to="10" duration="1"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    expect(Transform.posX[entity]).toBe(0);

    state.step(0.5);
    expect(Transform.posX[entity]).toBeGreaterThan(0);
    expect(Transform.posX[entity]).toBeLessThan(10);

    state.step(0.5);
    expect(Transform.posX[entity]).toBeCloseTo(10, 1);
  });

  it('should support easing from XML', () => {
    const xml = `
      <root>
        <entity transform="pos: 0 0 0">
          <tween target="transform.pos-y" to="100" duration="1" easing="quad-out"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    state.step(0.25);
    // Quad-out easing should be faster at the start
    expect(Transform.posY[entity]).toBeGreaterThan(25);
  });

  it('should support loop modes from XML', () => {
    const xml = `
      <root>
        <entity transform="pos: 0 0 0">
          <tween target="transform.pos-z" to="10" duration="1" loop="ping-pong"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    state.step(0.5);
    const midValue = Transform.posZ[entity];
    expect(midValue).toBeGreaterThan(0);

    state.step(1.0);
    // After 1.5 seconds in ping-pong, should be coming back
    const returnValue = Transform.posZ[entity];
    expect(returnValue).toBeLessThan(10);
  });

  it('should handle multiple tweens on same entity', () => {
    const xml = `
      <root>
        <entity transform="pos: 0 0 0">
          <tween target="transform.pos-x" to="10" duration="1"></tween>
          <tween target="transform.pos-y" to="5" duration="0.5"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    state.step(0.5);
    expect(Transform.posX[entity]).toBeCloseTo(5, 1);
    expect(Transform.posY[entity]).toBeCloseTo(5, 1);

    state.step(0.5);
    expect(Transform.posX[entity]).toBeCloseTo(10, 1);
    expect(Transform.posY[entity]).toBeCloseTo(5, 1);
  });

  it('should handle position and rotation tweens simultaneously', () => {
    const xml = `
      <root>
        <entity transform="pos: 0 1 5">
          <tween target="transform.pos-y" to="3" duration="2"></tween>
          <tween target="rotation" to="0 360 0" duration="4"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    state.step(0);

    expect(WorldTransform.posY[entity]).toBe(1);
    expect(WorldTransform.eulerY[entity]).toBe(0);

    state.step(1);
    expect(WorldTransform.posY[entity]).toBeCloseTo(2, 1);
    expect(WorldTransform.eulerY[entity]).toBeCloseTo(90, 1);

    const quat90 = {
      x: 0,
      y: Math.sin(Math.PI / 4),
      z: 0,
      w: Math.cos(Math.PI / 4),
    };
    expect(WorldTransform.rotY[entity]).toBeCloseTo(quat90.y, 2);

    state.step(1);
    expect(WorldTransform.posY[entity]).toBeCloseTo(3, 1);
    expect(WorldTransform.eulerY[entity]).toBeCloseTo(180, 1);

    state.step(2);
    expect(WorldTransform.posY[entity]).toBeCloseTo(3, 1);
    expect(WorldTransform.eulerY[entity]).toBeCloseTo(360, 1);
  });

  it('should animate custom component properties', () => {
    const Velocity = defineComponent({
      velocityX: Types.f32,
      velocityY: Types.f32,
      velocityZ: Types.f32,
    });
    state.registerComponent('velocity', Velocity);

    const xml = `
      <root>
        <entity transform="pos: 0 10 0" velocity="velocity-x: 0">
          <tween target="velocity.velocity-x" from="0" to="10" duration="1" easing="quad-out"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    expect(state.hasComponent(entity, Velocity)).toBe(true);
    expect(Velocity.velocityX[entity]).toBe(0);

    state.step(0.5);
    expect(Velocity.velocityX[entity]).toBeGreaterThan(5);

    state.step(0.5);
    expect(Velocity.velocityX[entity]).toBeCloseTo(10, 1);
  });

  it('should handle rotation shorthand with array values', () => {
    const xml = `
      <root>
        <entity transform="">
          <tween target="rotation" to="90 180 270" duration="1"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    const tweenValues = defineQuery([TweenValue])(state.world);
    expect(tweenValues.length).toBe(3);

    state.step(1);
    expect(Transform.eulerX[entity]).toBeCloseTo(90, 1);
    expect(Transform.eulerY[entity]).toBeCloseTo(180, 1);
    expect(Transform.eulerZ[entity]).toBeCloseTo(270, 1);
  });

  it('should handle at shorthand for position', () => {
    const xml = `
      <root>
        <entity transform="">
          <tween target="at" from="0 0 0" to="10 20 30" duration="1"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    state.step(0.5);
    expect(Transform.posX[entity]).toBeCloseTo(5, 1);
    expect(Transform.posY[entity]).toBeCloseTo(10, 1);
    expect(Transform.posZ[entity]).toBeCloseTo(15, 1);

    state.step(0.5);
    expect(Transform.posX[entity]).toBeCloseTo(10, 1);
    expect(Transform.posY[entity]).toBeCloseTo(20, 1);
    expect(Transform.posZ[entity]).toBeCloseTo(30, 1);
  });

  it('should handle scale shorthand with single value', () => {
    const xml = `
      <root>
        <entity transform="scale: 1">
          <tween target="scale" from="1 1 1" to="2 2 2" duration="1"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    state.step(0.5);
    expect(Transform.scaleX[entity]).toBeCloseTo(1.5, 1);
    expect(Transform.scaleY[entity]).toBeCloseTo(1.5, 1);
    expect(Transform.scaleZ[entity]).toBeCloseTo(1.5, 1);
  });

  it('should support easing attribute', () => {
    const xml = `
      <root>
        <entity transform="pos: 0 0 0">
          <tween target="transform.pos-x" to="100" duration="1" easing="elastic-out"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBeGreaterThan(0);

    state.step(0.7);
    const value = Transform.posX[entity];
    expect(value).not.toBeCloseTo(70, 10);
  });

  it('should handle complex animation sequence', () => {
    const xml = `
      <root>
        <entity transform="pos: 0 0 0">
          <tween target="transform.pos-x" from="-5" to="5" duration="3" loop="ping-pong"></tween>
          <tween target="transform.euler-y" to="360" duration="10" loop="loop"></tween>
          <tween target="transform.scale-x" from="1" to="1.5" duration="1" ease="sine-in-out" loop="ping-pong"></tween>
          <tween target="transform.scale-z" from="1" to="1.5" duration="1" ease="sine-in-out" loop="ping-pong"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBe(4);

    state.step(1.5);
    expect(Transform.posX[entity]).toBeCloseTo(0, 1);
    expect(Transform.eulerY[entity]).toBeCloseTo(54, 2);

    state.step(1.5);
    expect(Transform.posX[entity]).toBeCloseTo(5, 1);

    state.step(3);
    expect(Transform.posX[entity]).toBeCloseTo(-5, 1);
  });

  it('should use current value when from is omitted', () => {
    const xml = `
      <root>
        <entity transform="pos: 5 10 15">
          <tween target="transform.pos-y" to="20" duration="1"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    expect(Transform.posY[entity]).toBe(10);

    state.step(0.5);
    expect(Transform.posY[entity]).toBeCloseTo(15, 1);
  });

  it('should handle bounce easing', () => {
    const xml = `
      <root>
        <entity transform="">
          <tween target="transform.pos-y" from="0" to="10" duration="1" easing="bounce-out"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    state.step(0.9);
    const nearEndValue = Transform.posY[entity];
    expect(nearEndValue).toBeLessThan(10);

    state.step(0.1);
    expect(Transform.posY[entity]).toBeCloseTo(10, 1);
  });

  it('should handle back easing with overshoot', () => {
    const xml = `
      <root>
        <entity transform="">
          <tween target="transform.pos-x" from="0" to="10" duration="1" easing="back-out"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    state.step(0.8);
    const value = Transform.posX[entity];
    expect(value).toBeGreaterThan(10);

    state.step(0.2);
    expect(Transform.posX[entity]).toBeCloseTo(10, 1);
  });
});
