import { type ZodError } from 'zod';
import {
  formatUnknownAttribute,
  formatEnumError,
  formatTypeMismatch,
  formatSyntaxError,
} from '../../plugins/recipes/diagnostics';
import { recipeSchemas } from './schemas';

interface FormatOptions {
  recipeName?: string;
  availableRecipes?: string[];
  filename?: string;
  lineNumber?: number;
}

function getPathString(path: (string | number)[]): string {
  return path
    .map((segment) => {
      if (typeof segment === 'number') return `[${segment}]`;
      return segment;
    })
    .join('.');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatZodIssue(issue: any, options: FormatOptions = {}): string {
  const { recipeName = 'unknown' } = options;
  const pathStr = getPathString(issue.path || []);

  switch (issue.code) {
    case 'invalid_union': {
      if (issue.unionErrors && issue.unionErrors.length > 0) {
        const unionErrors = issue.unionErrors
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((err: any) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            err.issues.map((i: any) => formatZodIssue(i, options))
          )
          .flat();
        return unionErrors[0] || `Invalid value at ${pathStr}`;
      }
      return `Invalid value at ${pathStr}`;
    }

    case 'invalid_enum_value': {
      const received = String(issue.received);
      const validOptions = issue.options as string[];
      return formatEnumError(recipeName, pathStr, received, validOptions);
    }

    case 'invalid_type': {
      if (issue.path.length === 0) {
        return `Invalid ${recipeName} configuration - expected object`;
      }
      return formatTypeMismatch(
        recipeName,
        pathStr,
        issue.expected,
        issue.received
      );
    }

    case 'unrecognized_keys': {
      const unknownKeys = issue.keys;
      const messages: string[] = [];

      for (const key of unknownKeys) {
        const schema = recipeSchemas[recipeName as keyof typeof recipeSchemas];
        const availableAttrs = schema ? Object.keys(schema.shape) : [];

        const message = formatUnknownAttribute(key, recipeName, availableAttrs);
        messages.push(message);
      }

      return messages.join('\n');
    }

    case 'invalid_string': {
      if (issue.validation === 'regex') {
        let expected = 'valid format';

        if (
          pathStr.includes('pos') ||
          pathStr.includes('size') ||
          pathStr.includes('scale')
        ) {
          expected = '"x y z" (three space-separated numbers)';
        } else if (pathStr.includes('color')) {
          expected = 'hex color (#RRGGBB or 0xRRGGBB)';
        }

        return formatSyntaxError(
          recipeName,
          String(issue.path[issue.path.length - 1]),
          expected,
          'invalid format'
        );
      }

      return `[${recipeName}.${pathStr}] Invalid string format`;
    }

    case 'too_small':
    case 'too_big': {
      const constraint = issue.code === 'too_small' ? 'minimum' : 'maximum';
      const value = issue.code === 'too_small' ? issue.minimum : issue.maximum;
      return `[${recipeName}.${pathStr}] Value must be ${constraint} ${value}`;
    }

    case 'invalid_literal': {
      return `[${recipeName}.${pathStr}] Expected "${issue.expected}", got "${issue.received}"`;
    }

    case 'custom': {
      return issue.message || `[${recipeName}.${pathStr}] Validation failed`;
    }

    default: {
      return `[${recipeName}${pathStr ? '.' + pathStr : ''}] ${issue.message}`;
    }
  }
}

export function formatZodError(
  error: ZodError,
  options: FormatOptions = {}
): string {
  const { filename, lineNumber } = options;
  const messages: string[] = [];

  if (filename) {
    const location = lineNumber ? `:${lineNumber}` : '';
    messages.push(`Validation error in ${filename}${location}:`);
  }

  const uniqueMessages = new Set<string>();
  for (const issue of error.issues) {
    const message = formatZodIssue(issue, options);
    if (message && !uniqueMessages.has(message)) {
      uniqueMessages.add(message);
      messages.push(message);
    }
  }

  return messages.join('\n');
}

export function formatValidationSuccess(
  recipeName: string,
  attributeCount: number
): string {
  return `✓ Validated ${recipeName} with ${attributeCount} attributes`;
}

export function formatBuildValidationSummary(
  fileCount: number,
  elementCount: number,
  errors: string[]
): string {
  if (errors.length === 0) {
    return `✓ Successfully validated ${elementCount} elements across ${fileCount} files`;
  }

  const errorWord = errors.length === 1 ? 'error' : 'errors';
  const messages = [
    `✗ Validation failed with ${errors.length} ${errorWord}:`,
    ...errors,
  ];

  return messages.join('\n');
}
