import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { defineQuery, parseXMLToEntities, State, XMLParser } from 'vibegame';
import { TransformsPlugin } from 'vibegame/transforms';
import { Sequence, TweenPlugin } from 'vibegame/tweening';

describe('Sequence Parser', () => {
  let state: State;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    state.registerPlugin(TransformsPlugin);
    state.registerPlugin(TweenPlugin);
  });

  it('should parse sequence element from XML', () => {
    const xml = `
      <root>
        <entity name="cube" transform="pos: 0 0 0"></entity>
        <sequence>
          <tween target="cube" attr="transform.pos-x" from="0" to="10" duration="1"></tween>
        </sequence>
      </root>
    `;

    const parsed = XMLParser.parse(xml);
    parseXMLToEntities(state, parsed.root);

    const sequences = defineQuery([Sequence])(state.world);
    expect(sequences.length).toBe(1);
    expect(Sequence.itemCount[sequences[0]]).toBe(1);
  });
});
