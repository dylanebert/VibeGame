import { beforeEach, describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import {
  validateXMLContent,
  validateHTMLContent,
  validateParsedElement,
} from 'vibegame/core/validation';
import { XMLParser } from 'vibegame';

describe('XML Validation Integration', () => {
  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;
  });

  describe('validateXMLContent', () => {
    it('should validate valid static-part XML', () => {
      const xml = `<static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#90ee90"></static-part>`;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid shape in XML', () => {
      const xml = `<static-part pos="0 0 0" shape="invalid" size="1 1 1" color="#ff0000"></static-part>`;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid');
    });

    it('should reject missing required attributes', () => {
      const xml = `<static-part shape="box" size="1 1 1" color="#ff0000"></static-part>`;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid value at pos');
    });

    it('should validate entity with optional attributes', () => {
      const xml = `<entity pos="0 5 0" euler="0 45 0" scale="2"></entity>`;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(true);
    });

    it('should validate nested entities', () => {
      const xml = `
        <entity pos="0 0 0">
          <entity pos="1 0 0"></entity>
          <entity pos="-1 0 0"></entity>
        </entity>
      `;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(true);
    });

    it('should reject unknown recipe elements', () => {
      const xml = `<unknown-recipe pos="0 0 0"></unknown-recipe>`;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown element');
    });

    it('should validate world element', () => {
      const xml = `<world canvas="#game" sky="#87ceeb" fog-near="10" fog-far="100"></world>`;

      const result = validateXMLContent(xml);
      expect(result.success).toBe(true);
    });

    it('should include filename in error messages', () => {
      const xml = `<static-part pos="invalid" shape="box" size="1 1 1" color="#ff0000"></static-part>`;

      const result = validateXMLContent(xml, { filename: 'test.xml' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('test.xml');
    });
  });

  describe('validateHTMLContent', () => {
    it('should extract and validate XML from HTML', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <body>
          <world canvas="#game">
            <static-part pos="0 0 0" shape="box" size="1 1 1" color="#ff0000"></static-part>
            <dynamic-part pos="0 5 0" shape="sphere" size="1" color="#00ff00"></dynamic-part>
          </world>
        </body>
        </html>
      `;

      const results = validateHTMLContent(html);
      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
    });

    it('should validate multiple XML elements in HTML', () => {
      const html = `
        <div>
          <static-part pos="0 0 0" shape="box" size="1 1 1" color="#ff0000"></static-part>
          <dynamic-part pos="0 5 0" shape="sphere" size="1" color="#00ff00"></dynamic-part>
        </div>
      `;

      const results = validateHTMLContent(html);
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should include line numbers in validation errors', () => {
      const html = `
        <html>
        <body>
          <static-part pos="invalid" shape="box" size="1 1 1" color="#ff0000"></static-part>
        </body>
        </html>
      `;

      const results = validateHTMLContent(html);
      expect(results.length).toBe(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });

    it('should handle self-closing tags', () => {
      const html = `
        <entity pos="0 0 0" />
        <player speed="10" />
      `;

      const results = validateHTMLContent(html);
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  describe('validateParsedElement', () => {
    it('should validate parsed element tree', () => {
      const xml = `<entity pos="0 0 0"><entity pos="1 1 1"></entity></entity>`;
      const parsed = XMLParser.parse(xml);

      const result = validateParsedElement(parsed.root);
      expect(result.success).toBe(true);
    });

    it('should validate deeply nested structures', () => {
      const xml = `
        <entity>
          <entity>
            <entity>
              <entity pos="0 0 0"></entity>
            </entity>
          </entity>
        </entity>
      `;
      const parsed = XMLParser.parse(xml);

      const result = validateParsedElement(parsed.root);
      expect(result.success).toBe(true);
    });

    it('should catch errors in nested elements', () => {
      const xml = `
        <entity pos="0 0 0">
          <static-part pos="invalid" shape="box" size="1 1 1" color="#ff0000"></static-part>
        </entity>
      `;
      const parsed = XMLParser.parse(xml);

      const result = validateParsedElement(parsed.root);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should validate complex recipe combinations', () => {
      const xml = `
        <world canvas="#game">
          <static-part pos="0 -0.5 0" shape="box" size="20 1 20" color="#90ee90"></static-part>
          <dynamic-part pos="0 5 0" shape="sphere" size="1" color="#ff0000" mass="10"></dynamic-part>
          <player speed="8" jump-height="3"></player>
          <camera distance="10" min-distance="5"></camera>
        </world>
      `;
      const parsed = XMLParser.parse(xml);

      const result = validateParsedElement(parsed.root);
      expect(result.success).toBe(true);
    });
  });
});
