import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { JSDOM } from 'jsdom';
import { parseXMLToEntities, State, XMLParser } from 'vibegame';
import { DefaultPlugins } from 'vibegame/defaults';

describe('Parser Diagnostics', () => {
  let state: State;
  let consoleWarnSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;

    state = new State();
    for (const plugin of DefaultPlugins) {
      state.registerPlugin(plugin);
    }

    consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Error Messages', () => {
    it('should provide helpful error for unknown element with suggestions', () => {
      const xml = XMLParser.parse('<plyaer></plyaer>');

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(/Unknown element <plyaer> - did you mean <player>\?/);
    });

    it('should provide helpful error for invalid property syntax', () => {
      const xml = XMLParser.parse('<entity transform="pos 0 5 0"></entity>');

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(
        /\[transform\] Syntax error in "pos 0 5 0" - missing colon after property name/
      );
    });

    it('should provide helpful error for wrong number of values', () => {
      const xml = XMLParser.parse('<entity transform="pos: 0 5"></entity>');

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(
        /\[transform.pos\] Wrong number of values - expected 1 \(broadcast\) or 3 \(x, y, z\), got 2/
      );
    });

    it('should provide helpful error for invalid enum value', () => {
      const xml = XMLParser.parse(
        '<static-part body="type: cube"></static-part>'
      );

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(/\[body.type\] Invalid value "cube"/);
    });

    it('should provide helpful error for unknown property with suggestions', () => {
      const xml = XMLParser.parse(
        '<entity transform="positon: 0 5 0"></entity>'
      );

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(/\[transform.positon\] Property not found/);
    });

    it('should provide helpful error for empty property name', () => {
      const xml = XMLParser.parse('<entity transform=": 0 5 0"></entity>');

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(
        /\[transform\] Syntax error in ": 0 5 0" - property name is empty/
      );
    });

    it('should provide helpful error for empty property value', () => {
      const xml = XMLParser.parse('<entity transform="pos:"></entity>');

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(/\[transform\] Syntax error in "pos:" - value is empty/);
    });

    it('should provide helpful error for type mismatch', () => {
      const xml = XMLParser.parse('<entity transform="pos-x: hello"></entity>');

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(
        /\[transform.pos-x\] Type mismatch - expected number, got string "hello"/
      );
    });
  });

  describe('Warning Messages', () => {
    it('should warn about unknown attributes with suggestions', () => {
      const xml = XMLParser.parse('<entity transfrom="pos: 0 5 0"></entity>');
      parseXMLToEntities(state, xml.root);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[entity\] Unknown attribute "transfrom" - did you mean "transform"\?/
        )
      );
    });

    it('should warn when world-transform is assigned', () => {
      const xml = XMLParser.parse(
        '<entity world-transform="pos: 0 5 0"></entity>'
      );
      parseXMLToEntities(state, xml.root);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[entity\] Warning: "world-transform" is read-only/
        )
      );
    });

    it('should show available options for unknown attributes', () => {
      const xml = XMLParser.parse('<entity unknownattr="value"></entity>');
      parseXMLToEntities(state, xml.root);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[entity\] Unknown attribute "unknownattr"[\s\S]*Available:/
        )
      );
    });
  });

  describe('Component Child Elements', () => {
    it('should provide clear error when components are used as child elements', () => {
      const xml = XMLParser.parse(`
        <entity>
          <transform pos="0 5 0"></transform>
        </entity>
      `);

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(/Unknown element <transform>/);
    });
  });

  describe('Enum Value Validation', () => {
    it('should list valid options for body.type enum', () => {
      const xml = XMLParser.parse(
        '<static-part body="type: invalid"></static-part>'
      );

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(/Valid options:.*static.*dynamic.*kinematic/);
    });

    it('should list valid options for renderer.shape enum', () => {
      const xml = XMLParser.parse(
        '<entity renderer="shape: invalid"></entity>'
      );

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(/Valid options: box, sphere/);
    });

    it('should list valid options for collider.shape enum', () => {
      const xml = XMLParser.parse(
        '<static-part collider="shape: invalid"></static-part>'
      );

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(/Valid options:.*box.*sphere.*capsule/);
    });
  });

  describe('Quaternion Parsing', () => {
    it('should provide clear error for incorrect quaternion value count', () => {
      const xml = XMLParser.parse('<entity transform="rot: 0 45"></entity>');

      expect(() => {
        parseXMLToEntities(state, xml.root);
      }).toThrow(
        /\[transform.rot\] Wrong number of values - expected 3 \(Euler angles\) or 4 \(quaternion\), got 2/
      );
    });
  });
});
