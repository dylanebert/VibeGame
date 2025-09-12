import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import {
  formatZodError,
  formatValidationSuccess,
  formatBuildValidationSummary,
} from 'vibegame/core/validation';

describe('Error Formatter', () => {
  describe('formatZodError', () => {
    it('should format enum errors with valid options', () => {
      const schema = z.enum(['box', 'sphere', 'cylinder']);
      const result = schema.safeParse('triangle');

      if (!result.success) {
        const formatted = formatZodError(result.error, {
          recipeName: 'test-recipe',
        });
        expect(formatted).toContain('[test-recipe]');
        expect(formatted).toContain('Invalid');
        expect(formatted).toContain('expected one of');
      }
    });

    it('should format type mismatch errors', () => {
      const schema = z.number();
      const result = schema.safeParse('not-a-number');

      if (!result.success) {
        const formatted = formatZodError(result.error, {
          recipeName: 'test-recipe',
        });
        expect(formatted).toContain('expected object');
      }
    });

    it('should format with file and line context', () => {
      const schema = z.object({ name: z.string() });
      const result = schema.safeParse({ name: 123 });

      if (!result.success) {
        const formatted = formatZodError(result.error, {
          recipeName: 'entity',
          filename: 'test.xml',
          lineNumber: 42,
        });
        expect(formatted).toContain('test.xml:42');
        expect(formatted).toContain('[entity.name]');
      }
    });

    it('should format unknown keys errors', () => {
      const schema = z.object({ known: z.string() }).strict();
      const result = schema.safeParse({ known: 'value', unknown: 'value' });

      if (!result.success) {
        const formatted = formatZodError(result.error, {
          recipeName: 'test-recipe',
        });
        expect(formatted).toContain('Unknown attribute');
        expect(formatted).toContain('unknown');
      }
    });

    it('should format string validation errors', () => {
      const schema = z.string().regex(/^[a-z]+$/);
      const result = schema.safeParse('ABC123');

      if (!result.success) {
        const formatted = formatZodError(result.error, {
          recipeName: 'test-recipe',
        });
        expect(formatted).toContain('[test-recipe]');
        expect(formatted).toContain('must match pattern');
      }
    });

    it('should format path in nested objects', () => {
      const schema = z.object({
        nested: z.object({
          deep: z.object({
            value: z.number(),
          }),
        }),
      });
      const result = schema.safeParse({
        nested: { deep: { value: 'wrong' } },
      });

      if (!result.success) {
        const formatted = formatZodError(result.error, {
          recipeName: 'test',
        });
        expect(formatted).toContain('nested.deep.value');
      }
    });

    it('should handle union type errors', () => {
      const schema = z.union([z.string(), z.number()]);
      const result = schema.safeParse(true);

      if (!result.success) {
        const formatted = formatZodError(result.error, {
          recipeName: 'test',
        });
        expect(formatted).toContain('Invalid value');
      }
    });

    it('should format literal mismatch errors', () => {
      const schema = z.literal('exact');
      const result = schema.safeParse('different');

      if (!result.success) {
        const formatted = formatZodError(result.error, {
          recipeName: 'test',
        });
        expect(formatted).toContain('expected "exact"');
      }
    });

    it('should deduplicate identical messages', () => {
      const schema = z.object({
        a: z.number(),
        b: z.number(),
      });
      const result = schema.safeParse({ a: 'text', b: 'text' });

      if (!result.success) {
        const formatted = formatZodError(result.error, {
          recipeName: 'test',
        });
        const lines = formatted.split('\n');
        const uniqueLines = new Set(lines);
        expect(uniqueLines.size).toBeLessThanOrEqual(lines.length);
      }
    });
  });

  describe('formatValidationSuccess', () => {
    it('should format success message', () => {
      const message = formatValidationSuccess('static-part', 5);
      expect(message).toContain('✓');
      expect(message).toContain('static-part');
      expect(message).toContain('5 attributes');
    });
  });

  describe('formatBuildValidationSummary', () => {
    it('should format successful build summary', () => {
      const summary = formatBuildValidationSummary(10, 50, []);
      expect(summary).toContain('✓');
      expect(summary).toContain('50 elements');
      expect(summary).toContain('10 files');
    });

    it('should format failed build summary', () => {
      const errors = ['file1.xml: Error 1', 'file2.xml: Error 2'];
      const summary = formatBuildValidationSummary(10, 50, errors);
      expect(summary).toContain('✗');
      expect(summary).toContain('2 errors');
      expect(summary).toContain('file1.xml: Error 1');
      expect(summary).toContain('file2.xml: Error 2');
    });

    it('should handle single error correctly', () => {
      const errors = ['single.xml: Single error'];
      const summary = formatBuildValidationSummary(1, 1, errors);
      expect(summary).toContain('1 error');
      expect(summary).not.toContain('1 errors');
    });
  });
});
