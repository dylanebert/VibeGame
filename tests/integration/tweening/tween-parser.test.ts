import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { defineQuery, parseXMLToEntities, State, XMLParser } from 'vibegame';
import { TransformsPlugin } from 'vibegame/transforms';
import { Tween, TweenPlugin, TweenValue } from 'vibegame/tweening';

describe('Tween Parser', () => {
  let state: State;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(TweenPlugin);
  });

  it('should parse tween element from XML', () => {
    const xml = `
      <root>
        <entity name="cube" transform=""></entity>
        <tween target="cube" attr="transform.pos-x" from="0" to="10" duration="2"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);

    expect(results.length).toBe(2);

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBe(1);
    expect(Tween.duration[tweens[0]]).toBe(2);
  });

  it('should throw when target attribute is missing', () => {
    const xml = `
      <root>
        <entity name="cube" transform=""></entity>
        <tween attr="transform.pos-x" to="10" duration="1"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    expect(() => parseXMLToEntities(state, parsed.root)).toThrow('"target"');
  });

  it('should throw when to attribute is missing', () => {
    const xml = `
      <root>
        <entity name="cube" transform=""></entity>
        <tween target="cube" attr="transform.pos-x" from="0" duration="1"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    expect(() => parseXMLToEntities(state, parsed.root)).toThrow('"to"');
  });

  it('should throw when target cannot be resolved', () => {
    const xml = `
      <root>
        <entity name="cube" transform=""></entity>
        <tween target="sphere" attr="transform.pos-x" to="10" duration="1"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    expect(() => parseXMLToEntities(state, parsed.root)).toThrow('sphere');
  });

  it('should throw when target property cannot be resolved', () => {
    const xml = `
      <root>
        <entity name="cube" transform=""></entity>
        <tween target="cube" attr="invalid.field" to="10" duration="1"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    expect(() => parseXMLToEntities(state, parsed.root)).toThrow(
      'invalid.field'
    );
  });

  it('should parse multiple tweens targeting same entity', () => {
    const xml = `
      <root>
        <entity name="cube" transform=""></entity>
        <tween target="cube" attr="transform.pos-x" to="10" duration="1"></tween>
        <tween target="cube" attr="transform.pos-y" to="20" duration="2"></tween>
        <tween target="cube" attr="transform.pos-z" to="30" duration="3"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);
    const entity = results[0].entity;

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBe(3);

    const tweenValues = defineQuery([TweenValue])(state.world);
    expect(tweenValues.length).toBe(3);

    const targets = tweenValues.map((v) => TweenValue.target[v]);
    expect(targets.every((t) => t === entity)).toBe(true);
  });

  it('should parse tweens targeting different entities', () => {
    const xml = `
      <root>
        <entity name="cube1" transform=""></entity>
        <entity name="cube2" transform=""></entity>
        <tween target="cube1" attr="transform.pos-x" to="10" duration="1"></tween>
        <tween target="cube2" attr="transform.pos-y" to="20" duration="1"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBe(2);
  });

  it('should use default duration when not specified', () => {
    const xml = `
      <root>
        <entity name="cube" transform=""></entity>
        <tween target="cube" attr="transform.pos-x" to="10"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBe(1);
    expect(Tween.duration[tweens[0]]).toBe(1);
  });

  it('should parse vector values from attributes', () => {
    const xml = `
      <root>
        <entity name="cube" transform=""></entity>
        <tween target="cube" attr="rotation" from="0 0 0" to="90 180 270" duration="1"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const tweenValues = defineQuery([TweenValue])(state.world);
    expect(tweenValues.length).toBe(3);

    const toValues = tweenValues.map((v) => TweenValue.to[v]);
    expect(toValues).toContain(90);
    expect(toValues).toContain(180);
    expect(toValues).toContain(270);
  });

  it('should parse easing attribute', () => {
    const xml = `
      <root>
        <entity name="cube" transform=""></entity>
        <tween
          target="cube"
          attr="transform.pos-x"
          to="10"
          duration="1"
          easing="bounce-out">
        </tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBe(1);

    expect(Tween.easingIndex[tweens[0]]).toBeGreaterThan(0);
  });

  it('should handle numeric string values', () => {
    const xml = `
      <root>
        <entity name="cube" transform=""></entity>
        <tween target="cube" attr="transform.pos-x" from="5.5" to="15.5" duration="2.5"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const tweenValues = defineQuery([TweenValue])(state.world);
    expect(tweenValues.length).toBe(1);
    expect(TweenValue.from[tweenValues[0]]).toBe(5.5);
    expect(TweenValue.to[tweenValues[0]]).toBe(15.5);

    const tweens = defineQuery([Tween])(state.world);
    expect(Tween.duration[tweens[0]]).toBe(2.5);
  });

  it('should create tweens for each entity in recipe', () => {
    state.registerRecipe({
      name: 'moving-platform',
      components: ['transform'],
    });

    const xml = `
      <root>
        <moving-platform name="platform1"></moving-platform>
        <moving-platform name="platform2"></moving-platform>
        <tween target="platform1" attr="transform.pos-x" from="-10" to="10" duration="2"></tween>
        <tween target="platform2" attr="transform.pos-y" from="0" to="5" duration="1"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);

    expect(results.length).toBe(4);

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBe(2);
  });

  it('should throw error for invalid easing value', () => {
    const xml = `
      <root>
        <entity name="cube" transform=""></entity>
        <tween target="cube" attr="transform.pos-x" to="10" duration="1" easing="invalid-easing"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    expect(() => parseXMLToEntities(state, parsed.root)).toThrow('easing');
  });

  it('should suggest correct easing for typos', () => {
    const xml = `
      <root>
        <entity name="cube" transform=""></entity>
        <tween target="cube" attr="transform.pos-x" to="10" duration="1" easing="sine-ou"></tween>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    expect(() => parseXMLToEntities(state, parsed.root)).toThrow('sine-out');
  });
});
