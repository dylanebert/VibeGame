import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { parseXMLToEntities, State, XMLParser, defineQuery } from 'vibegame';
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
        <entity transform="">
          <tween target="transform.pos-x" from="0" to="10" duration="2"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);

    expect(results.length).toBe(1);

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBe(1);
    expect(Tween.duration[tweens[0]]).toBe(2);
  });

  it('should warn when target attribute is missing', () => {
    const consoleWarnSpy = console.warn;
    let warning = '';
    console.warn = (msg: string) => {
      warning = msg;
    };

    const xml = `
      <root>
        <entity transform="">
          <tween to="10" duration="1"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    expect(warning).toContain('Tween element missing target attribute');

    console.warn = consoleWarnSpy;
  });

  it('should warn when to attribute is missing', () => {
    const consoleWarnSpy = console.warn;
    let warning = '';
    console.warn = (msg: string) => {
      warning = msg;
    };

    const xml = `
      <root>
        <entity transform="">
          <tween target="transform.pos-x" from="0" duration="1"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    expect(warning).toContain('Tween element missing "to" attribute');

    console.warn = consoleWarnSpy;
  });

  it('should warn when target cannot be resolved', () => {
    const consoleWarnSpy = console.warn;
    let warning = '';
    console.warn = (msg: string) => {
      warning = msg;
    };

    const xml = `
      <root>
        <entity transform="">
          <tween target="invalid.field" to="10" duration="1"></tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    expect(warning).toContain('Could not resolve tween target: invalid.field');

    console.warn = consoleWarnSpy;
  });

  it('should parse multiple tweens on same entity', () => {
    const xml = `
      <root>
        <entity transform="">
          <tween target="transform.pos-x" to="10" duration="1"></tween>
          <tween target="transform.pos-y" to="20" duration="2"></tween>
          <tween target="transform.pos-z" to="30" duration="3"></tween>
        </entity>
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

  it('should parse nested entities with tweens', () => {
    const xml = `
      <root>
        <entity transform="">
          <tween target="transform.pos-x" to="10" duration="1"></tween>
          <entity transform="">
            <tween target="transform.pos-y" to="20" duration="1"></tween>
          </entity>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);

    expect(results.length).toBe(1);
    expect(results[0].children.length).toBe(1);

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBe(2);
  });

  it('should use default duration when not specified', () => {
    const xml = `
      <root>
        <entity transform="">
          <tween target="transform.pos-x" to="10"></tween>
        </entity>
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
        <entity transform="">
          <tween target="rotation" from="0 0 0" to="90 180 270" duration="1"></tween>
        </entity>
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

  it('should parse easing and loop attributes', () => {
    const xml = `
      <root>
        <entity transform="">
          <tween
            target="transform.pos-x"
            to="10"
            duration="1"
            easing="bounce-out"
            loop="ping-pong">
          </tween>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBe(1);

    expect(Tween.loopMode[tweens[0]]).toBe(2);
    expect(Tween.easingIndex[tweens[0]]).toBeGreaterThan(0);
  });

  it('should handle tween elements among entity children', () => {
    const xml = `
      <root>
        <entity transform="">
          <tween target="transform.pos-x" to="10" duration="1"></tween>
          <entity transform="">
            <tween target="transform.pos-y" to="5" duration="0.5"></tween>
          </entity>
        </entity>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBe(2);

    const durations = tweens.map((t) => Tween.duration[t]).sort();
    expect(durations).toEqual([0.5, 1]);
  });

  it('should handle numeric string values', () => {
    const xml = `
      <root>
        <entity transform="">
          <tween target="transform.pos-x" from="5.5" to="15.5" duration="2.5"></tween>
        </entity>
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
        <moving-platform>
          <tween target="transform.pos-x" from="-10" to="10" duration="2" loop="ping-pong"></tween>
        </moving-platform>
        <moving-platform>
          <tween target="transform.pos-y" from="0" to="5" duration="1" loop="loop"></tween>
        </moving-platform>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    const results = parseXMLToEntities(state, parsed.root);

    expect(results.length).toBe(2);

    const tweens = defineQuery([Tween])(state.world);
    expect(tweens.length).toBe(2);
  });
});
