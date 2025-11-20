import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import type { ParsedElement, Parser } from 'vibegame';
import {
  findElements,
  ParseContext,
  State,
  traverseElements,
  XMLParser,
  XMLValueParser,
} from 'vibegame';

describe('XML Parser', () => {
  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;
  });

  describe('XMLParser.parse', () => {
    it('should parse XML string into element tree', () => {
      const xml = `
        <world>
          <entity pos="0 1 0" euler="0 45 0">
            <box size="1 1 1" color="#ff0000"></box>
            <rigidbody type="dynamic"></rigidbody>
          </entity>
        </world>
      `;

      const result = XMLParser.parse(xml);

      expect(result.root.tagName).toBe('world');
      expect(result.root.children.length).toBe(1);

      const entity = result.root.children[0];
      expect(entity.tagName).toBe('entity');
      expect(entity.attributes.pos).toEqual({ x: 0, y: 1, z: 0 });
      expect(entity.attributes.euler).toEqual({ x: 0, y: 45, z: 0 });

      expect(entity.children.length).toBe(2);
      expect(entity.children[0].tagName).toBe('box');
      expect(entity.children[0].attributes.size).toEqual({ x: 1, y: 1, z: 1 });
      expect(entity.children[0].attributes.color).toBe(16711680);

      expect(entity.children[1].tagName).toBe('rigidbody');
      expect(entity.children[1].attributes.type).toBe('dynamic');
    });

    it('should handle empty elements', () => {
      const xml = '<root><empty /></root>';
      const result = XMLParser.parse(xml);

      expect(result.root.tagName).toBe('root');
      expect(result.root.children.length).toBe(1);
      expect(result.root.children[0].tagName).toBe('empty');
      expect(result.root.children[0].children.length).toBe(0);
    });

    it('should handle nested structures', () => {
      const xml = `
        <root>
          <level1>
            <level2>
              <level3></level3>
            </level2>
          </level1>
        </root>
      `;

      const result = XMLParser.parse(xml);
      expect(result.root.tagName).toBe('root');
      expect(result.root.children[0].tagName).toBe('level1');
      expect(result.root.children[0].children[0].tagName).toBe('level2');
      expect(result.root.children[0].children[0].children[0].tagName).toBe(
        'level3'
      );
    });
  });

  describe('XMLValueParser.parse', () => {
    it('should parse numbers', () => {
      expect(XMLValueParser.parse('42')).toBe(42);
      expect(XMLValueParser.parse('3.14')).toBe(3.14);
      expect(XMLValueParser.parse('-10')).toBe(-10);
      expect(XMLValueParser.parse('0')).toBe(0);
    });

    it('should parse booleans', () => {
      expect(XMLValueParser.parse('true')).toBe(true);
      expect(XMLValueParser.parse('false')).toBe(false);
    });

    it('should parse vectors', () => {
      expect(XMLValueParser.parse('1 2 3')).toEqual({ x: 1, y: 2, z: 3 });
      expect(XMLValueParser.parse('0 0 0')).toEqual({ x: 0, y: 0, z: 0 });
      expect(XMLValueParser.parse('-1 0.5 100')).toEqual({
        x: -1,
        y: 0.5,
        z: 100,
      });
      expect(XMLValueParser.parse('1.5 2.5')).toEqual({ x: 1.5, y: 2.5 });
    });

    it('should parse hex colors with 0x prefix', () => {
      expect(XMLValueParser.parse('0xff0000')).toBe(16711680);
      expect(XMLValueParser.parse('0x00ff00')).toBe(65280);
      expect(XMLValueParser.parse('0x0000ff')).toBe(255);
      expect(XMLValueParser.parse('0xffffff')).toBe(16777215);
      expect(XMLValueParser.parse('0x000000')).toBe(0);
    });

    it('should parse hex colors with # prefix', () => {
      expect(XMLValueParser.parse('#ff0000')).toBe(16711680);
      expect(XMLValueParser.parse('#00ff00')).toBe(65280);
      expect(XMLValueParser.parse('#0000ff')).toBe(255);
      expect(XMLValueParser.parse('#ffffff')).toBe(16777215);
      expect(XMLValueParser.parse('#000000')).toBe(0);
      expect(XMLValueParser.parse('#FF0000')).toBe(16711680);
      expect(XMLValueParser.parse('#FFFFFF')).toBe(16777215);
    });

    it('should parse strings', () => {
      expect(XMLValueParser.parse('hello world')).toBe('hello world');
      expect(XMLValueParser.parse('text')).toBe('text');
      expect(XMLValueParser.parse('some-identifier')).toBe('some-identifier');
      expect(XMLValueParser.parse('')).toBe('');
    });

    it('should handle edge cases', () => {
      expect(XMLValueParser.parse('1e3')).toBe(1000);
      expect(isNaN(XMLValueParser.parse('NaN') as number)).toBe(true);
      expect(XMLValueParser.parse('Infinity')).toBe(Infinity);
      expect(XMLValueParser.parse('undefined')).toBe('undefined');
    });
  });

  describe('traverseElements', () => {
    it('should traverse all elements in tree', () => {
      const xml = `
        <root>
          <entity>
            <child1></child1>
            <child2></child2>
          </entity>
          <entity></entity>
        </root>
      `;

      const result = XMLParser.parse(xml);
      const visited: string[] = [];

      traverseElements(result.root, {
        onElement: (element) => {
          visited.push(element.tagName);
        },
      });

      expect(visited).toEqual(['entity', 'child1', 'child2', 'entity']);
    });

    it('should handle single element', () => {
      const xml = '<single></single>';
      const result = XMLParser.parse(xml);
      const visited: string[] = [];

      traverseElements(result.root, {
        onElement: (element) => {
          visited.push(element.tagName);
        },
      });

      expect(visited).toEqual([]);
    });

    it('should provide access to element attributes', () => {
      const xml = '<root><entity id="test" value="42"></entity></root>';
      const result = XMLParser.parse(xml);
      const attributes: Array<Record<string, any>> = [];

      traverseElements(result.root, {
        onElement: (element) => {
          if (element.tagName === 'entity') {
            attributes.push(element.attributes);
          }
        },
      });

      expect(attributes.length).toBe(1);
      expect(attributes[0].id).toBe('test');
      expect(attributes[0].value).toBe(42);
    });
  });

  describe('findElements', () => {
    it('should find elements matching predicate', () => {
      const xml = `
        <root>
          <entity type="player"></entity>
          <entity type="enemy"></entity>
          <box></box>
          <entity type="enemy"></entity>
        </root>
      `;

      const result = XMLParser.parse(xml);
      const enemies = findElements(
        result.root,
        (el) => el.attributes.type === 'enemy'
      );

      expect(enemies.length).toBe(2);
      expect(enemies[0].attributes.type).toBe('enemy');
      expect(enemies[1].attributes.type).toBe('enemy');
    });

    it('should find elements by tag name', () => {
      const xml = `
        <root>
          <entity></entity>
          <box></box>
          <entity></entity>
          <sphere></sphere>
        </root>
      `;

      const result = XMLParser.parse(xml);
      const entities = findElements(
        result.root,
        (el) => el.tagName === 'entity'
      );

      expect(entities.length).toBe(2);
      expect(entities[0].tagName).toBe('entity');
      expect(entities[1].tagName).toBe('entity');
    });

    it('should find nested elements', () => {
      const xml = `
        <root>
          <parent>
            <target></target>
          </parent>
          <other>
            <target></target>
            <target></target>
          </other>
        </root>
      `;

      const result = XMLParser.parse(xml);
      const targets = findElements(
        result.root,
        (el) => el.tagName === 'target'
      );

      expect(targets.length).toBe(3);
    });

    it('should return empty array when no matches', () => {
      const xml = '<root><entity></entity></root>';
      const result = XMLParser.parse(xml);
      const notFound = findElements(
        result.root,
        (el) => el.tagName === 'nonexistent'
      );

      expect(notFound).toEqual([]);
    });
  });

  describe('Custom Parser Registration', () => {
    it('should register and invoke custom parser', () => {
      const state = new State();
      let parserCalled = false;
      let receivedEntity = -1;
      let receivedElement: ParsedElement | undefined;

      const customParser: Parser = ({ entity, element }) => {
        parserCalled = true;
        receivedEntity = entity;
        receivedElement = element;
        const pos = element.attributes.pos as {
          x: number;
          y: number;
          z: number;
        };
        if (pos) {
          console.log(`Entity ${entity} at position ${JSON.stringify(pos)}`);
        }
      };

      state.registerConfig({
        parsers: { 'my-tag': customParser },
      });

      const parser = state.getParser('my-tag');
      expect(parser).toBe(customParser);

      const testEntity = 123;
      const testElement: ParsedElement = {
        tagName: 'my-tag',
        attributes: { pos: { x: 1, y: 2, z: 3 } },
        children: [],
      };
      const context = new ParseContext(state);

      parser?.({ entity: testEntity, element: testElement, state, context });

      expect(parserCalled).toBe(true);
      expect(receivedEntity).toBe(testEntity);
      expect(receivedElement).toBeDefined();
      expect(receivedElement!.tagName).toBe('my-tag');
      expect(receivedElement!.attributes.pos).toEqual({ x: 1, y: 2, z: 3 });
    });
  });
});
